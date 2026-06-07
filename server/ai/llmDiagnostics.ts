import type { OpenAILlmClient } from "./openaiClient";

export type LlmHealthCheckInput = {
  client?: OpenAILlmClient;
  text: string;
  model: string;
  apiStyle: "responses" | "chat_completions";
  baseUrlType: "openai_official" | "custom";
};

export type LlmHealthCheckResult = {
  ok: boolean;
  hasContent: boolean;
  request: string;
  reply: string;
  model: string;
  apiStyle: "responses" | "chat_completions";
  baseUrlType: "openai_official" | "custom";
  latencyMs: number;
  testedAt: string;
  error?: string;
};

export async function runLlmHealthCheck({
  client,
  text,
  model,
  apiStyle,
  baseUrlType
}: LlmHealthCheckInput): Promise<LlmHealthCheckResult> {
  const request = text.trim() || "请用一句中文回复：LLM 连接正常。";
  const startedAt = Date.now();
  const base = {
    request,
    model,
    apiStyle,
    baseUrlType,
    testedAt: new Date().toISOString()
  };

  if (!client) {
    return {
      ...base,
      ok: false,
      hasContent: false,
      reply: "",
      latencyMs: Date.now() - startedAt,
      error: "LLM client is not configured."
    };
  }

  try {
    const reply = await client.generateText({
      system: [
        "你是一个连接测试助手。",
        "请用一到两句自然中文回答用户，不要返回 JSON。",
        "如果用户只是测试连接，请明确表示模型已经返回了内容。"
      ].join("\n"),
      user: request,
      temperature: 0.2
    });
    const normalizedReply = reply.trim();

    return {
      ...base,
      ok: normalizedReply.length > 0,
      hasContent: normalizedReply.length > 0,
      reply: normalizedReply,
      latencyMs: Date.now() - startedAt,
      error: normalizedReply.length > 0 ? undefined : "LLM returned an empty response."
    };
  } catch (error) {
    return {
      ...base,
      ok: false,
      hasContent: false,
      reply: "",
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "LLM health check failed."
    };
  }
}
