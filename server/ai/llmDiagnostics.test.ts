import { describe, expect, it } from "vitest";
import { runLlmHealthCheck } from "./llmDiagnostics";
import type { OpenAILlmClient } from "./openaiClient";

describe("runLlmHealthCheck", () => {
  it("reports a successful text response with metadata", async () => {
    const client: OpenAILlmClient = {
      generateText: async () => "今晚可以来一杯清爽的 French 75。",
      generateJson: async () => {
        throw new Error("not used");
      },
      generateWebJson: async () => {
        throw new Error("not used");
      }
    };

    const result = await runLlmHealthCheck({
      client,
      text: "测试一下",
      model: "openai/gpt-5.4-mini",
      apiStyle: "chat_completions",
      baseUrlType: "custom"
    });

    expect(result.ok).toBe(true);
    expect(result.hasContent).toBe(true);
    expect(result.reply).toBe("今晚可以来一杯清爽的 French 75。");
    expect(result.model).toBe("openai/gpt-5.4-mini");
    expect(result.apiStyle).toBe("chat_completions");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("reports failure without pretending content exists", async () => {
    const client: OpenAILlmClient = {
      generateText: async () => {
        throw new Error("network failed");
      },
      generateJson: async () => {
        throw new Error("not used");
      },
      generateWebJson: async () => {
        throw new Error("not used");
      }
    };

    const result = await runLlmHealthCheck({
      client,
      text: "测试一下",
      model: "openai/gpt-5.4-mini",
      apiStyle: "chat_completions",
      baseUrlType: "custom"
    });

    expect(result.ok).toBe(false);
    expect(result.hasContent).toBe(false);
    expect(result.reply).toBe("");
    expect(result.error).toContain("network failed");
  });

  it("reports missing client as not configured", async () => {
    const result = await runLlmHealthCheck({
      client: undefined,
      text: "测试一下",
      model: "openai/gpt-5.4-mini",
      apiStyle: "chat_completions",
      baseUrlType: "custom"
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("LLM client is not configured.");
  });
});
