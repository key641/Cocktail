import express from "express";
import { ingredients } from "../src/data/ingredients";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseIngredientsLocally } from "../src/domain/ingredientParser";
import { createOpenAILlmClient, createFallbackClient } from "./ai/openaiClient";
import { runLlmHealthCheck } from "./ai/llmDiagnostics";
import { parseRequestForAgent } from "./ai/parseRequest";
import { runBartenderAgent } from "./agent/bartenderAgent";
import { searchCocktailRecipeTool } from "./agent/tools";
import { loadLocalEnv } from "./env";

loadLocalEnv();

const app = express();
const port = Number(process.env.PORT ?? 4174);
const apiKey = process.env.OPENAI_API_KEY;
const openAIModel = process.env.OPENAI_MODEL_FAST ?? "gpt-5-mini";
const openAIBaseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1/responses";
const openAIApiStyle = process.env.OPENAI_API_STYLE === "chat_completions" ? "chat_completions" : "responses";
const aiTimeoutMs = Number(process.env.AI_TIMEOUT_MS ?? 8000);
const feedbackStorage = process.env.FEEDBACK_STORAGE ?? "jsonl";
const feedbackLogPath = resolve(process.env.FEEDBACK_LOG_PATH ?? "server/data/feedback.jsonl");
const feedbackAdminToken = process.env.FEEDBACK_ADMIN_TOKEN;
const notionToken = process.env.NOTION_TOKEN ?? process.env.NOTION_API_KEY;
const notionFeedbackDataSourceId = process.env.NOTION_FEEDBACK_DATA_SOURCE_ID;
const notionFeedbackDatabaseId = process.env.NOTION_FEEDBACK_DATABASE_ID;
const notionVersion = process.env.NOTION_VERSION ?? "2026-03-11";
const fallbackApiKey = process.env.FALLBACK_OPENAI_API_KEY;
const hasFallback = Boolean(apiKey && fallbackApiKey);
let openAIClient: ReturnType<typeof createOpenAILlmClient> | undefined;
if (apiKey && fallbackApiKey) {
  openAIClient = createFallbackClient({
    primary: {
      apiKey,
      model: openAIModel,
      baseUrl: openAIBaseUrl,
      apiStyle: openAIApiStyle,
      timeoutMs: aiTimeoutMs
    },
    fallback: {
      apiKey: fallbackApiKey as string,
      model: process.env.FALLBACK_OPENAI_MODEL ?? openAIModel,
      baseUrl: process.env.FALLBACK_OPENAI_BASE_URL ?? openAIBaseUrl,
      apiStyle: (process.env.FALLBACK_OPENAI_API_STYLE ?? openAIApiStyle) as "responses" | "chat_completions",
      timeoutMs: aiTimeoutMs
    },
    fallbackTimeoutMs: Number(process.env.AI_FALLBACK_TIMEOUT_MS) || 3000
  });
} else if (apiKey) {
  openAIClient = createOpenAILlmClient({
    apiKey,
    model: openAIModel,
    baseUrl: openAIBaseUrl,
    apiStyle: openAIApiStyle,
    timeoutMs: aiTimeoutMs
  });
}

app.use(express.json());
// CORS: allow all origins
app.use((_request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (_request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }
  next();
});

app.get("/api/agent/status", (_request, response) => {
  response.json({
    hasOpenAIClient: Boolean(openAIClient),
    model: openAIModel,
    baseUrlType: openAIBaseUrl.includes("api.openai.com") ? "openai_official" : "custom",
    apiStyle: openAIApiStyle,
    timeoutMs: aiTimeoutMs,
    hasFallback: hasFallback,
    fallbackModel: hasFallback ? (process.env.FALLBACK_OPENAI_MODEL ?? openAIModel) : undefined,
    fallbackBaseUrl: hasFallback ? (process.env.FALLBACK_OPENAI_BASE_URL ?? openAIBaseUrl) : undefined,
  });
});

function cleanFeedbackText(value: unknown, maxLength: number) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function buildRichText(content: string) {
  return content ? [{ text: { content: content.slice(0, 1900) } }] : [];
}

async function appendFeedbackJsonl(entry: Record<string, unknown>) {
  await mkdir(dirname(feedbackLogPath), { recursive: true });
  await appendFile(feedbackLogPath, `${JSON.stringify(entry)}\n`, "utf8");
}

async function createNotionFeedbackPage(entry: {
  id: string;
  createdAt: string;
  context: string;
  tone: string;
  relationship?: string;
  text: string;
  messageId?: string;
  pageUrl?: string;
  userAgent?: string;
  ip?: string;
}) {
  if (!notionToken || (!notionFeedbackDataSourceId && !notionFeedbackDatabaseId)) {
    throw new Error("Notion feedback storage is not configured.");
  }

  const parent = notionFeedbackDataSourceId
    ? { data_source_id: notionFeedbackDataSourceId }
    : { database_id: notionFeedbackDatabaseId };

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Content-Type": "application/json",
      "Notion-Version": notionVersion
    },
    body: JSON.stringify({
      parent,
      properties: {
        Name: {
          title: [{ text: { content: `${entry.tone} · ${entry.context} · ${entry.createdAt}` } }]
        },
        Tone: { select: { name: entry.tone } },
        Context: { select: { name: entry.context } },
        Status: { select: { name: "new" } },
        Relationship: entry.relationship ? { select: { name: entry.relationship } } : { select: null },
        "Message ID": { rich_text: buildRichText(entry.messageId ?? "") },
        Text: { rich_text: buildRichText(entry.text) },
        "Page URL": entry.pageUrl ? { url: entry.pageUrl } : { url: null },
        "Created At": { date: { start: entry.createdAt } },
        "User Agent": { rich_text: buildRichText(entry.userAgent ?? "") },
        IP: { rich_text: buildRichText(entry.ip ?? "") },
        "Storage ID": { rich_text: buildRichText(entry.id) }
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Notion feedback write failed: ${response.status} ${body.slice(0, 300)}`);
  }

  return (await response.json()) as { id?: string; url?: string };
}

app.post("/api/feedback", async (request, response) => {
  const context = request.body?.context === "ai_reply" ? "ai_reply" : "global";
  const tone = ["like", "dislike", "general"].includes(request.body?.tone) ? request.body.tone : "general";
  const relationship = ["knows_me", "not_yet", "prefer_not"].includes(request.body?.relationship) ? request.body.relationship : undefined;
  const text = cleanFeedbackText(request.body?.text, 2000);

  const entry = {
    id: `feedback-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    context,
    tone,
    relationship,
    text,
    messageId: cleanFeedbackText(request.body?.messageId, 120) || undefined,
    pageUrl: cleanFeedbackText(request.body?.pageUrl, 500) || undefined,
    userAgent: cleanFeedbackText(request.get("user-agent"), 500) || undefined,
    ip: request.ip
  };

  const storageResults: Record<string, unknown> = {};
  const warnings: string[] = [];
  const jsonlBackupEnabled = process.env.FEEDBACK_JSONL_BACKUP !== "false";
  const shouldWriteNotion = feedbackStorage === "notion" || feedbackStorage === "both";
  const shouldWriteJsonl = feedbackStorage === "jsonl" || feedbackStorage === "both" || (shouldWriteNotion && jsonlBackupEnabled);

  if (shouldWriteJsonl) {
    try {
      await appendFeedbackJsonl(entry);
      storageResults.jsonl = true;
    } catch (error) {
      storageResults.jsonl = false;
      warnings.push(error instanceof Error ? error.message : "Failed to save JSONL feedback.");
    }
  }

  if (shouldWriteNotion) {
    try {
      const notionPage = await createNotionFeedbackPage(entry);
      storageResults.notion = { ok: true, pageId: notionPage.id, url: notionPage.url };
    } catch (error) {
      storageResults.notion = { ok: false };
      warnings.push(error instanceof Error ? error.message : "Failed to save Notion feedback.");
    }
  }

  const saved = storageResults.jsonl === true || Boolean((storageResults.notion as { ok?: boolean } | undefined)?.ok);
  if (!saved) {
    response.status(500).json({ ok: false, id: entry.id, storage: storageResults, warnings });
    return;
  }

  response.status(warnings.length > 0 ? 202 : 201).json({ ok: true, id: entry.id, storage: storageResults, warnings });
});

app.get("/api/feedback", async (request, response) => {
  const token = String(request.get("x-feedback-token") ?? request.query.token ?? "");
  if (!feedbackAdminToken || token !== feedbackAdminToken) {
    response.status(403).json({ ok: false, error: "Feedback access denied." });
    return;
  }

  const limit = Math.min(Math.max(Number(request.query.limit ?? 100), 1), 500);

  try {
    const raw = await readFile(feedbackLogPath, "utf8");
    const feedback = raw
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-limit)
      .map((line) => JSON.parse(line));

    response.json({ ok: true, feedback });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      response.json({ ok: true, feedback: [] });
      return;
    }

    response.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Failed to read feedback."
    });
  }
});

app.post("/api/openai-test", async (request, response) => {
  const text = String(request.body?.text ?? "浣犲ソ");

  if (!openAIClient) {
    response.status(400).json({ ok: false, error: "OPENAI_API_KEY is not configured." });
    return;
  }

  try {
    const reply = await openAIClient.generateText({
      system: "You are a helpful assistant. Reply to the user message in a single sentence.",
      user: text
    });

    response.json({ ok: true, request: text, reply });
  } catch (error) {
    response.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "OpenAI test request failed."
    });
  }
});

app.post("/api/llm/health", async (request, response) => {
  const text = String(request.body?.text ?? "");
  const result = await runLlmHealthCheck({
    client: openAIClient,
    text,
    model: openAIModel,
    apiStyle: openAIApiStyle,
    baseUrlType: openAIBaseUrl.includes("api.openai.com") ? "openai_official" : "custom"
  });

  response.status(result.ok ? 200 : 500).json(result);
});

app.post("/api/agent/chat", async (request, response) => {
  const text = String(request.body?.text ?? "");
  const result = await runBartenderAgent({
    text,
    client: openAIClient,
    session: request.body?.session
  });
  response.json(result);
});

app.post("/api/agent/chat/stream", async (request, response) => {
  response.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const text = String(request.body?.text ?? "");

  function sendSSE(event: string, data: unknown) {
    response.write(`event: ${event}
data: ${JSON.stringify(data)}

`);
  }

  try {
    const result = await runBartenderAgent({
      text,
      client: openAIClient,
      session: request.body?.session,
      onTrace: (entry) => sendSSE("trace", entry),
    });

    if (result.status === "safety_blocked") {
      sendSSE("safety_blocked", {
        message: result.message,
        understanding: result.understanding,
        agentTrace: result.agentTrace,
      });
    } else {
      sendSSE("result", {
        status: result.status,
        message: result.message,
        understanding: result.understanding,
        agentTrace: result.agentTrace,
        recommendation: result.recommendation,
        primaryRecommendation: result.primaryRecommendation,
        alternatives: result.alternatives,
        trustSignals: result.trustSignals,
        citations: result.citations,
        toolResults: result.toolResults,
      });
    }

    sendSSE("done", {});
  } catch (error) {
    sendSSE("error", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    sendSSE("done", {});
  } finally {
    response.end();
  }
});

app.post("/api/agent/search-recipe", async (request, response) => {
  const query = String(request.body?.query ?? "");
  const officialOnly = Boolean(request.body?.officialOnly ?? false);
  const result = await searchCocktailRecipeTool({
    query,
    officialOnly,
    client: openAIClient
  });
  response.json(result);
});

app.post("/api/ai/parse-request", async (request, response) => {
  const text = String(request.body?.text ?? "");
  const result = await parseRequestForAgent({
    text,
    client: openAIClient
  });
  response.json(result);
});

app.post("/api/parse-ingredients", async (request, response) => {
  const text = String(request.body?.text ?? "");
  const local = parseIngredientsLocally(text);

  if (!openAIClient || !text.trim()) {
    response.json(local);
    return;
  }

  try {
    const parsed = await openAIClient.generateJson<{ ingredients?: string[]; unknown?: string[] }>({
      system: "Extract cocktail ingredients from user text. Return strict JSON with ingredient ids from the allowed list and unknown free text.",
      user: {
        allowedIngredients: ingredients.map((ingredient) => ({
          id: ingredient.id,
          name: ingredient.name,
          aliases: ingredient.aliases
        })),
        text
      },
      schemaName: "parsed_cocktail_ingredients",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          ingredients: {
            type: "array",
            items: { type: "string", enum: ingredients.map((ingredient) => ingredient.id) }
          },
          unknown: { type: "array", items: { type: "string" } }
        },
        required: ["ingredients", "unknown"]
      }
    });
    response.json({
      ingredients: Array.from(new Set([...local.ingredients, ...(parsed.ingredients ?? [])])),
      unknown: parsed.unknown ?? local.unknown
    });
  } catch {
    response.json(local);
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Cocktail parser API running on http://127.0.0.1:${port}`);
});
