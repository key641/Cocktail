import { describe, expect, it } from "vitest";
import { createFallbackClient, createOpenAIJsonClient, OpenAIJsonClientError } from "./openaiClient";

describe("createOpenAIJsonClient", () => {
  it("can generate plain text without forcing a JSON schema", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      requests.push({ url: String(url), init: init ?? {} });
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: "今晚适合来一杯清爽的长饮。"
              }
            }
          ]
        }),
        { status: 200 }
      );
    };

    const client = createOpenAIJsonClient({
      apiKey: "test-key",
      model: "openai/gpt-5.4-mini",
      baseUrl: "https://api.ofox.ai/v1",
      apiStyle: "chat_completions",
      fetchImpl
    });

    const result = await client.generateText({
      system: "Reply in Chinese.",
      user: "我想喝清爽一点"
    });

    const requestBody = JSON.parse(String(requests[0].init.body));
    expect(result).toBe("今晚适合来一杯清爽的长饮。");
    expect(requests[0].url).toBe("https://api.ofox.ai/v1/chat/completions");
    expect(requestBody.response_format).toBeUndefined();
    expect(requestBody.messages[1].content).toBe("我想喝清爽一点");
  });

  it("calls the Responses API and parses structured JSON output", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      requests.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify({ output_text: "{\"ok\":true}" }), { status: 200 });
    };

    const client = createOpenAIJsonClient({
      apiKey: "test-key",
      model: "test-model",
      fetchImpl
    });

    const result = await client.generateJson<{ ok: boolean }>({
      system: "Return JSON.",
      user: { text: "hello" },
      schemaName: "test_schema",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: { ok: { type: "boolean" } },
        required: ["ok"]
      }
    });

    expect(result).toEqual({ ok: true });
    expect(requests[0].url).toBe("https://api.openai.com/v1/responses");
    expect(requests[0].init.headers).toMatchObject({
      Authorization: "Bearer test-key",
      "Content-Type": "application/json"
    });
    expect(JSON.parse(String(requests[0].init.body)).model).toBe("test-model");
  });

  it("throws a typed error when the OpenAI response is not ok", async () => {
    const fetchImpl: typeof fetch = async () => new Response("bad", { status: 500 });
    const client = createOpenAIJsonClient({ apiKey: "test-key", model: "test-model", fetchImpl });

    await expect(
      client.generateJson({
        system: "Return JSON.",
        user: {},
        schemaName: "test_schema",
        schema: { type: "object", properties: {}, additionalProperties: false }
      })
    ).rejects.toBeInstanceOf(OpenAIJsonClientError);
  });

  it("can call an OpenAI-compatible chat completions endpoint", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      requests.push({ url: String(url), init: init ?? {} });
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({ ok: true })
              }
            }
          ]
        }),
        { status: 200 }
      );
    };

    const client = createOpenAIJsonClient({
      apiKey: "test-key",
      model: "openai/gpt-5.4-mini",
      baseUrl: "https://api.ofox.ai/v1",
      apiStyle: "chat_completions",
      fetchImpl
    });

    const result = await client.generateJson<{ ok: boolean }>({
      system: "Return JSON.",
      user: { text: "hello" },
      schemaName: "test_schema",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: { ok: { type: "boolean" } },
        required: ["ok"]
      }
    });

    const requestBody = JSON.parse(String(requests[0].init.body));
    expect(result).toEqual({ ok: true });
    expect(requests[0].url).toBe("https://api.ofox.ai/v1/chat/completions");
    expect(requestBody.model).toBe("openai/gpt-5.4-mini");
    expect(requestBody.messages[0].role).toBe("system");
    expect(requestBody.response_format).toEqual({ type: "json_object" });
    expect(requestBody.messages[0].content).toContain("Respond with valid JSON only.");
  });

  it("can disable reasoning for a fast copywriting client", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      requests.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify({ choices: [{ message: { content: "{}" } }] }), { status: 200 });
    };
    const client = createOpenAIJsonClient({
      apiKey: "test-key",
      model: "deepseek-v4-flash",
      baseUrl: "https://api.deepseek.com",
      apiStyle: "chat_completions",
      disableThinking: true,
      fetchImpl
    });

    await client.generateText({ system: "Return JSON", user: "test", maxTokens: 320 });

    const requestBody = JSON.parse(String(requests[0].init.body));
    expect(requestBody.thinking).toEqual({ type: "disabled" });
    expect(requestBody.max_tokens).toBe(320);
  });

  it("uses JSON mode and accepts fenced JSON from compatible chat providers", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      requests.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify({ choices: [{ message: { content: "```json\n{\"ok\":true}\n```" } }] }), { status: 200 });
    };
    const client = createOpenAIJsonClient({
      apiKey: "test-key",
      model: "deepseek-v4-flash",
      baseUrl: "https://api.deepseek.com",
      apiStyle: "chat_completions",
      disableThinking: true,
      fetchImpl
    });

    const result = await client.generateJson<{ ok: boolean }>({
      system: "Return JSON.",
      user: {},
      schemaName: "test_schema",
      schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] }
    });

    const requestBody = JSON.parse(String(requests[0].init.body));
    expect(result).toEqual({ ok: true });
    expect(requestBody.response_format).toEqual({ type: "json_object" });
    expect(requestBody.max_tokens).toBe(800);
  });

  it("can call Responses API web search and return citations with structured JSON", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      requests.push({ url: String(url), init: init ?? {} });
      return new Response(
        JSON.stringify({
          output_text: JSON.stringify({
            cocktailName: "Mojito",
            sourceType: "iba_official",
            ingredients: [{ name: "White rum", amount: "45 ml" }],
            steps: ["Build in glass"],
            confidence: 0.9,
            notes: "Official-style recipe"
          }),
          output: [
            {
              type: "message",
              content: [
                {
                  type: "output_text",
                  text: "{}",
                  annotations: [
                    {
                      type: "url_citation",
                      url: "https://iba-world.com/mojito/",
                      title: "Mojito"
                    }
                  ]
                }
              ]
            }
          ]
        }),
        { status: 200 }
      );
    };
    const client = createOpenAIJsonClient({ apiKey: "test-key", model: "test-model", fetchImpl });

    const result = await client.generateWebJson<{
      cocktailName: string;
      sourceType: string;
      ingredients: Array<{ name: string; amount: string }>;
      steps: string[];
      confidence: number;
      notes: string;
    }>({
      system: "Search cocktail recipes.",
      user: { query: "IBA Mojito recipe" },
      schemaName: "external_recipe",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          cocktailName: { type: "string" },
          sourceType: { type: "string" },
          ingredients: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                name: { type: "string" },
                amount: { type: "string" }
              },
              required: ["name", "amount"]
            }
          },
          steps: { type: "array", items: { type: "string" } },
          confidence: { type: "number" },
          notes: { type: "string" }
        },
        required: ["cocktailName", "sourceType", "ingredients", "steps", "confidence", "notes"]
      },
      allowedDomains: ["iba-world.com"]
    });

    const requestBody = JSON.parse(String(requests[0].init.body));
    expect(requestBody.tools).toEqual([{ type: "web_search", filters: { allowed_domains: ["iba-world.com"] } }]);
    expect(result.data.cocktailName).toBe("Mojito");
    expect(result.citations).toEqual([{ url: "https://iba-world.com/mojito/", title: "Mojito" }]);
  });
});

describe("createFallbackClient", () => {
  it("does not start the fallback before the primary request timeout", async () => {
    let fallbackCalls = 0;
    const primaryFetch: typeof fetch = async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      return new Response(JSON.stringify({ choices: [{ message: { content: "primary" } }] }), { status: 200 });
    };
    const fallbackFetch: typeof fetch = async () => {
      fallbackCalls += 1;
      return new Response(JSON.stringify({ choices: [{ message: { content: "fallback" } }] }), { status: 200 });
    };
    const client = createFallbackClient({
      primary: {
        apiKey: "primary-key",
        model: "primary-model",
        apiStyle: "chat_completions",
        timeoutMs: 100,
        fetchImpl: primaryFetch
      },
      fallback: {
        apiKey: "fallback-key",
        model: "fallback-model",
        apiStyle: "chat_completions",
        timeoutMs: 100,
        fetchImpl: fallbackFetch
      },
      fallbackTimeoutMs: 10
    });

    const result = await client.generateText({ system: "test", user: "test" });

    expect(result).toBe("primary");
    expect(fallbackCalls).toBe(0);
  });
});
