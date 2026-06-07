export type JsonSchema = {
  type: "object";
  additionalProperties?: boolean;
  properties?: Record<string, unknown>;
  required?: readonly string[];
};

export type GenerateJsonInput = {
  system: string;
  user: unknown;
  schemaName: string;
  schema: JsonSchema;
};

export type GenerateTextInput = {
  system: string;
  user: unknown;
  temperature?: number;
};

export type WebCitation = {
  url: string;
  title?: string;
};

export type GenerateWebJsonInput = GenerateJsonInput & {
  allowedDomains?: string[];
};

export type GenerateWebJsonResult<T> = {
  data: T;
  citations: WebCitation[];
};

export type OpenAILlmClient = {
  generateText(input: GenerateTextInput): Promise<string>;
  generateJson<T>(input: GenerateJsonInput): Promise<T>;
  generateWebJson<T>(input: GenerateWebJsonInput): Promise<GenerateWebJsonResult<T>>;
};

export type OpenAIJsonClient = OpenAILlmClient;

type CreateOpenAIJsonClientOptions = {
  apiKey: string;
  model: string;
  baseUrl?: string;
  apiStyle?: "responses" | "chat_completions";
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      annotations?: Array<{
        type?: string;
        url?: string;
        title?: string;
      }>;
    }>;
  }>;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export class OpenAIJsonClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenAIJsonClientError";
  }
}

function extractOutputText(completion: OpenAIResponse, fallback = "") {
  return completion.output_text ?? completion.output?.flatMap((item) => item.content ?? []).find((content) => content.text)?.text ?? fallback;
}

function extractUrlCitations(completion: OpenAIResponse): WebCitation[] {
  const citations = completion.output
    ?.flatMap((item) => item.content ?? [])
    .flatMap((content) => content.annotations ?? [])
    .filter((annotation) => annotation.type === "url_citation" && annotation.url)
    .map((annotation) => ({ url: annotation.url ?? "", title: annotation.title }))
    ?? [];

  return Array.from(new Map(citations.map((citation) => [citation.url, citation])).values());
}

export function createOpenAIJsonClient({
  apiKey,
  model,
  baseUrl = "https://api.openai.com/v1/responses",
  apiStyle = "responses",
  timeoutMs = 8000,
  fetchImpl = fetch
}: CreateOpenAIJsonClientOptions): OpenAILlmClient {
  async function postJson<T>(url: string, body: unknown, controller: AbortController): Promise<T> {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new OpenAIJsonClientError(`OpenAI request failed with status ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`);
    }

    return (await response.json()) as T;
  }

  async function postResponses(body: unknown, controller: AbortController) {
    return postJson<OpenAIResponse>(baseUrl, body, controller);
  }

  function chatCompletionsUrl() {
    return baseUrl.endsWith("/chat/completions")
      ? baseUrl
      : `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  }

  async function postChatCompletions(body: unknown, controller: AbortController) {
    return postJson<ChatCompletionResponse>(chatCompletionsUrl(), body, controller);
  }

  function extractChatContent(completion: ChatCompletionResponse, fallback = "") {
    return completion.choices?.[0]?.message?.content ?? fallback;
  }

  function buildJsonSystemPrompt(system: string, schemaName: string, schema: JsonSchema) {
    return [
      system,
      "Respond with valid JSON only.",
      `Return exactly one JSON object that matches the schema for ${schemaName}.`,
      "Do not include any explanatory text outside the JSON object."
    ].join("\n\n");
  }

  return {
    async generateText({ system, user, temperature = 0.4 }: GenerateTextInput): Promise<string> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        if (apiStyle === "chat_completions") {
          const completion = await postChatCompletions(
            {
              model,
              messages: [
                { role: "system", content: system },
                { role: "user", content: typeof user === "string" ? user : JSON.stringify(user) }
              ],
              temperature
            },
            controller
          );
          return extractChatContent(completion).trim();
        }

        const completion = await postResponses(
          {
            model,
            input: [
              { role: "system", content: system },
              { role: "user", content: typeof user === "string" ? user : JSON.stringify(user) }
            ],
            temperature
          },
          controller
        );
        return extractOutputText(completion).trim();
      } catch (error) {
        if (error instanceof OpenAIJsonClientError) {
          throw error;
        }
        throw new OpenAIJsonClientError(error instanceof Error ? error.message : "OpenAI text request failed");
      } finally {
        clearTimeout(timeout);
      }
    },

    async generateJson<T>({ system, user, schemaName, schema }: GenerateJsonInput): Promise<T> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        if (apiStyle === "chat_completions") {
          const completion = await postChatCompletions(
            {
              model,
              messages: [
                { role: "system", content: buildJsonSystemPrompt(system, schemaName, schema) },
                { role: "user", content: JSON.stringify(user) }
              ],
              temperature: 0
            },
            controller
          );
          return JSON.parse(extractChatContent(completion, "{}")) as T;
        }

        const completion = await postResponses(
          {
            model,
            input: [
              { role: "system", content: system },
              { role: "user", content: JSON.stringify(user) }
            ],
            text: {
              format: {
                type: "json_schema",
                name: schemaName,
                schema,
                strict: true
              }
            }
          },
          controller
        );
        return JSON.parse(extractOutputText(completion, "{}")) as T;
      } catch (error) {
        if (error instanceof OpenAIJsonClientError) {
          throw error;
        }
        throw new OpenAIJsonClientError(error instanceof Error ? error.message : "OpenAI request failed");
      } finally {
        clearTimeout(timeout);
      }
    },

    async generateWebJson<T>({ system, user, schemaName, schema, allowedDomains }: GenerateWebJsonInput): Promise<GenerateWebJsonResult<T>> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        if (apiStyle === "chat_completions") {
          const instructionParts = [
            buildJsonSystemPrompt(
              [
                system,
                "If web browsing is unavailable in this provider, answer from the provided user payload and mark weak sources as web_unverified.",
                allowedDomains?.length ? `Prefer these domains when known: ${allowedDomains.join(", ")}` : ""
              ].filter(Boolean).join("\n\n"),
              schemaName,
              schema
            )
          ].join("\n\n");

          const completion = await postChatCompletions(
            {
              model,
              messages: [
                { role: "system", content: instructionParts },
                { role: "user", content: JSON.stringify(user) }
              ],
              temperature: 0
            },
            controller
          );

          return {
            data: JSON.parse(extractChatContent(completion, "{}")) as T,
            citations: []
          };
        }

        const webSearchTool = allowedDomains?.length
          ? { type: "web_search", filters: { allowed_domains: allowedDomains } }
          : { type: "web_search" };
        const completion = await postResponses(
          {
            model,
            tools: [webSearchTool],
            tool_choice: "auto",
            input: [
              { role: "system", content: system },
              { role: "user", content: JSON.stringify(user) }
            ],
            text: {
              format: {
                type: "json_schema",
                name: schemaName,
                schema,
                strict: true
              }
            }
          },
          controller
        );

        return {
          data: JSON.parse(extractOutputText(completion, "{}")) as T,
          citations: extractUrlCitations(completion)
        };
      } catch (error) {
        if (error instanceof OpenAIJsonClientError) {
          throw error;
        }
        throw new OpenAIJsonClientError(error instanceof Error ? error.message : "OpenAI web search request failed");
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}

export const createOpenAILlmClient = createOpenAIJsonClient;

export function createFallbackClient(config: {
  primary: CreateOpenAIJsonClientOptions;
  fallback: CreateOpenAIJsonClientOptions;
  fallbackTimeoutMs?: number;
}): OpenAILlmClient {
  const primary = createOpenAIJsonClient(config.primary);
  const fallback = createOpenAIJsonClient(config.fallback);
  const raceTimeoutMs = config.fallbackTimeoutMs ?? 3000;

  async function withFallback<T>(fn: (client: OpenAILlmClient) => Promise<T>): Promise<T> {
    try {
      const result = await Promise.race([
        fn(primary),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Primary API timeout after ${raceTimeoutMs}ms`)),
            raceTimeoutMs
          )
        ),
      ]);
      return result;
    } catch (primaryError) {
      const primaryMsg = primaryError instanceof Error ? primaryError.message : String(primaryError);
      console.warn(`[fallback] Primary API 超时/失败: ${primaryMsg}. 切换到备用 API...`);
      try {
        return await fn(fallback);
      } catch (fallbackError) {
        const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        throw new OpenAIJsonClientError(
          `Both APIs failed. Primary: ${primaryMsg}. Fallback: ${fallbackMsg}`
        );
      }
    }
  }

  return {
    async generateText(input: GenerateTextInput) { return withFallback((c) => c.generateText(input)); },
    async generateJson<T>(input: GenerateJsonInput) { return withFallback((c) => c.generateJson<T>(input)); },
    async generateWebJson<T>(input: GenerateWebJsonInput) { return withFallback((c) => c.generateWebJson<T>(input)); },
  };
}