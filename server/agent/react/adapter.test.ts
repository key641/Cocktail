import { describe, expect, it } from "vitest";
import type { GenerateWebJsonResult, OpenAIJsonClient } from "../../ai/openaiClient";
import { runBartenderAgent } from "../bartenderAgent";
import { runReActAgent } from "./adapter";
import type { ReActStepDecision } from "./types";

const paperPlaneRecipe = {
  sourceType: "reputable_site",
  cocktailName: "Paper Plane",
  ingredients: [
    { name: "Bourbon", amount: "22.5 ml" },
    { name: "Aperol", amount: "22.5 ml" },
    { name: "Amaro Nonino", amount: "22.5 ml" },
    { name: "Lemon juice", amount: "22.5 ml" }
  ],
  steps: ["Shake with ice", "Strain into a coupe"],
  glass: "Coupe",
  garnish: "None",
  confidence: 0.88,
  notes: "Modern classic"
};

function scriptedClient(decisions: ReActStepDecision[]): OpenAIJsonClient {
  let cursor = 0;
  return {
    generateText: async () => "",
    generateJson: async <T,>() => {
      const decision = decisions[cursor];
      if (!decision) {
        throw new Error(`scripted client exhausted after ${cursor} decisions`);
      }
      cursor += 1;
      return decision as T;
    },
    generateWebJson: async <T,>(): Promise<GenerateWebJsonResult<T>> => ({
      data: paperPlaneRecipe as T,
      citations: [{ url: "https://example.com/paper-plane", title: "Paper Plane" }]
    })
  };
}

function neverCalledClient(): OpenAIJsonClient {
  return {
    generateText: async () => {
      throw new Error("LLM should not be called");
    },
    generateJson: async () => {
      throw new Error("LLM should not be called");
    },
    generateWebJson: async () => {
      throw new Error("LLM should not be called");
    }
  };
}

function step(action: ReActStepDecision["action"], args: unknown, thought = "思考中"): ReActStepDecision {
  return { thought, action, arguments: JSON.stringify(args) };
}

describe("runReActAgent", () => {
  it("blocks unsafe requests deterministically without calling the LLM", async () => {
    const result = await runReActAgent({ text: "我等下要开车，来一杯烈的", client: neverCalledClient() });

    expect(result.status).toBe("safety_blocked");
    expect(result.intent).toBe("safe_mocktail");
    expect(result.message).toContain("避免饮酒");
    expect(result.followUpActions).toEqual(["safe_mocktail"]);
    expect(result.sessionPatch).toBeDefined();
    expect(result.agentTrace?.some((entry) => entry.step === "安全检查")).toBe(true);
  });

  it("builds a full local recommendation response from the final outcome", async () => {
    const client = scriptedClient([
      step("match_cocktails", { flavors: ["refreshing", "sour"] }),
      step("final_recommendation", {
        cocktail_ref: "PLACEHOLDER",
        reason: "清爽带酸，正合适",
        intent: "classic_recommendation"
      })
    ]);
    const result = await runReActAgent({ text: "我想喝清爽酸一点的", client });

    expect(result.status).toBe("ok");
    expect(result.message).toBe("清爽带酸，正合适");
    expect(result.recommendation?.primary.reason).toBe("清爽带酸，正合适");
    expect(result.recommendation?.primary.recipeMode).toBe("local");
    expect(result.primaryRecommendation?.cocktail.id).toBe(result.recommendation?.primary.id);
    expect(result.recipe?.ingredients.length).toBeGreaterThan(0);
    expect(result.visualSpec?.glassType).toBeTruthy();
    // PLACEHOLDER 触发反幻觉替换，追加 uncertain 信号
    expect(result.trustSignals.some((signal) => signal.type === "uncertain")).toBe(true);
    // sessionPatch 必须把本次推荐写进 lastRecommendationIds 头部
    expect(result.sessionPatch?.lastRecommendationIds?.[0]).toBe(result.recommendation?.primary.id);
    expect(result.agentTrace?.some((entry) => entry.step === "ReAct 启动")).toBe(true);
  });

  it("maps clarification outcomes onto the clarification contract", async () => {
    const client = scriptedClient([
      step("ask_clarification", { question: "想要清爽的还是浓一点的？", options: ["清爽", "浓一点"] })
    ]);
    const result = await runReActAgent({ text: "随便来一杯", client });

    expect(result.status).toBe("ok");
    expect(result.intent).toBe("clarification");
    expect(result.message).toBe("想要清爽的还是浓一点的？");
    expect(result.clarification).toEqual({
      question: "想要清爽的还是浓一点的？",
      options: ["清爽", "浓一点"]
    });
    expect(result.recommendation).toBeUndefined();
    expect(result.sessionPatch).toBeDefined();
  });

  it("carries citations and external trust signals for external recommendations", async () => {
    const client = scriptedClient([
      step("search_external_recipe", { query: "Paper Plane cocktail recipe" }),
      step("final_recommendation", {
        cocktail_ref: "external-paper-plane",
        reason: "本地没有这杯，帮你查到了可信配方",
        intent: "named_cocktail_lookup"
      })
    ]);
    const result = await runReActAgent({ text: "我想喝 Paper Plane", client });

    expect(result.status).toBe("ok");
    expect(result.intent).toBe("named_cocktail_lookup");
    expect(result.recommendation?.primary.id).toBe("external-paper-plane");
    expect(result.citations.length).toBeGreaterThan(0);
    expect(result.citations[0].url).toContain("example.com");
    expect(result.trustSignals.length).toBeGreaterThan(0);
    expect(result.sessionPatch?.lastRecommendationIds?.[0]).toBe("external-paper-plane");
  });

  it("maps smalltalk outcomes without forcing a recommendation", async () => {
    const client = scriptedClient([
      step("smalltalk_reply", { reply: "在呢，想喝点什么跟我说～" })
    ]);
    const result = await runReActAgent({ text: "你好", client });

    expect(result.status).toBe("ok");
    expect(result.intent).toBe("smalltalk");
    expect(result.message).toBe("在呢，想喝点什么跟我说～");
    expect(result.recommendation).toBeUndefined();
  });
});

describe("runBartenderAgent dispatcher", () => {
  it("routes to the ReAct engine when engine is react and a client exists", async () => {
    const client = scriptedClient([
      step("ask_clarification", { question: "想要什么口味？", options: ["清爽", "甜"] })
    ]);
    const result = await runBartenderAgent({ text: "随便来一杯", client, engine: "react" });

    expect(result.intent).toBe("clarification");
    expect(result.clarification?.options).toEqual(["清爽", "甜"]);
  });

  it("falls back to the pipeline when the ReAct engine throws", async () => {
    const traces: string[] = [];
    const failingClient: OpenAIJsonClient = {
      generateText: async () => {
        throw new Error("provider down");
      },
      generateJson: async () => {
        throw new Error("provider down");
      },
      generateWebJson: async () => {
        throw new Error("provider down");
      }
    };
    const result = await runBartenderAgent({
      text: "我想喝清爽的",
      client: failingClient,
      engine: "react",
      onTrace: (entry) => traces.push(entry.step)
    });

    expect(traces).toContain("引擎降级");
    expect(result.status).toBe("ok");
    expect(result.primaryRecommendation?.cocktail.id).toBeTruthy();
    expect(result.recommendation?.primary.recipeMode).toBe("local");
  });

  it("keeps using the pipeline when engine is pipeline even with a client", async () => {
    const result = await runBartenderAgent({
      text: "我想喝清爽的",
      client: neverCalledClient(),
      engine: "pipeline"
    });

    // pipeline 对异常 client 全链路容错，走本地解析与本地推荐
    expect(result.status).toBe("ok");
    expect(result.primaryRecommendation?.cocktail.id).toBeTruthy();
  });
});
