import express from "express";
import { ingredients } from "../src/data/ingredients";
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
// CORS: allow Cloudflare Pages and local dev to call the API
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
