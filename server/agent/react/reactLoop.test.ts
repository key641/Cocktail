import { describe, expect, it } from "vitest";
import type { GenerateWebJsonResult, OpenAIJsonClient } from "../../ai/openaiClient";
import { runReActLoop } from "./reactLoop";
import { ReActLoopError, type ReActStepDecision } from "./types";

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

function step(action: ReActStepDecision["action"], args: unknown, thought = "思考中"): ReActStepDecision {
  return { thought, action, arguments: JSON.stringify(args) };
}

describe("runReActLoop", () => {
  it("completes the happy path: match then final recommendation", async () => {
    const client = scriptedClient([
      step("match_cocktails", { flavors: ["refreshing", "sour"], semantic_query: "清爽酸一点" }),
      step("final_recommendation", {
        cocktail_ref: "PLACEHOLDER",
        reason: "清爽带酸，正好是你要的方向",
        alternative_refs: [],
        intent: "classic_recommendation"
      })
    ]);
    // 第二步的 ref 依赖第一步结果，先跑一轮拿到真实 ref 再断言不可行；
    // 这里直接利用反幻觉守护：PLACEHOLDER 会被替换为本地匹配主推荐。
    const result = await runReActLoop({ text: "我想喝清爽酸一点的", client });

    expect(result.outcome.kind).toBe("final_recommendation");
    if (result.outcome.kind === "final_recommendation") {
      expect(result.store.localCandidates.has(result.outcome.args.cocktailRef)).toBe(true);
      expect(result.outcome.args.hallucinatedRef).toBe("PLACEHOLDER");
    }
    expect(result.steps.length).toBe(1);
    expect(result.store.lastMatch).toBeDefined();
  });

  it("accepts a valid ref produced by a prior tool observation", async () => {
    // 先用一次独立循环拿到确定性匹配结果的真实 ref
    const probe = await runReActLoop({
      text: "我想喝清爽的",
      client: scriptedClient([
        step("match_cocktails", { flavors: ["refreshing"] }),
        step("final_recommendation", { cocktail_ref: "x", reason: "r", intent: "classic_recommendation" })
      ])
    });
    const realRef = probe.store.lastMatch!.primary.cocktail.id;

    const result = await runReActLoop({
      text: "我想喝清爽的",
      client: scriptedClient([
        step("match_cocktails", { flavors: ["refreshing"] }),
        step("final_recommendation", { cocktail_ref: realRef, reason: "清爽方向没跑了", intent: "classic_recommendation" })
      ])
    });

    expect(result.outcome.kind).toBe("final_recommendation");
    if (result.outcome.kind === "final_recommendation") {
      expect(result.outcome.args.cocktailRef).toBe(realRef);
      expect(result.outcome.args.hallucinatedRef).toBeUndefined();
    }
  });

  it("returns clarification outcome directly", async () => {
    const client = scriptedClient([
      step("ask_clarification", { question: "想要清爽的还是浓一点的？", options: ["清爽", "浓一点"] })
    ]);
    const result = await runReActLoop({ text: "随便来一杯", client });

    expect(result.outcome.kind).toBe("ask_clarification");
    if (result.outcome.kind === "ask_clarification") {
      expect(result.outcome.args.question).toContain("清爽");
      expect(result.outcome.args.options).toEqual(["清爽", "浓一点"]);
    }
  });

  it("returns smalltalk outcome directly", async () => {
    const client = scriptedClient([
      step("smalltalk_reply", { reply: "在呢，想喝点什么跟我说～" })
    ]);
    const result = await runReActLoop({ text: "你好", client });

    expect(result.outcome.kind).toBe("smalltalk_reply");
  });

  it("feeds back an error observation on unknown action and lets the model recover", async () => {
    const client = scriptedClient([
      { thought: "试试", action: "make_coffee" as ReActStepDecision["action"], arguments: "{}" },
      step("smalltalk_reply", { reply: "好的，换个方式" })
    ]);
    const result = await runReActLoop({ text: "你好", client });

    expect(result.outcome.kind).toBe("smalltalk_reply");
    expect(result.steps[0].observation).toMatchObject({ error: expect.stringContaining("未知动作") });
  });

  it("uses external search results and keeps external refs valid for final", async () => {
    const client = scriptedClient([
      step("search_external_recipe", { query: "Paper Plane cocktail recipe" }),
      step("final_recommendation", {
        cocktail_ref: "external-paper-plane",
        reason: "本地没有这杯，帮你查到了外部可信配方",
        intent: "named_cocktail_lookup"
      })
    ]);
    const result = await runReActLoop({ text: "我想喝 Paper Plane", client });

    expect(result.outcome.kind).toBe("final_recommendation");
    if (result.outcome.kind === "final_recommendation") {
      expect(result.outcome.args.cocktailRef).toBe("external-paper-plane");
      expect(result.outcome.args.hallucinatedRef).toBeUndefined();
    }
    expect(result.store.externalRecipes.get("external-paper-plane")?.confidence).toBe(0.88);
  });

  it("force-finalizes with the best match when max steps are exhausted", async () => {
    const client = scriptedClient([
      step("match_cocktails", { flavors: ["refreshing"] }),
      step("match_cocktails", { flavors: ["refreshing", "sour"] })
    ]);
    const result = await runReActLoop({ text: "清爽酸一点", client, maxSteps: 2 });

    expect(result.outcome.kind).toBe("final_recommendation");
    if (result.outcome.kind === "final_recommendation") {
      expect(result.outcome.args.forced).toBe(true);
      expect(result.outcome.args.cocktailRef).toBe(result.store.lastMatch!.primary.cocktail.id);
    }
  });

  it("force-finalizes when the model repeats the exact same action", async () => {
    const client = scriptedClient([
      step("match_cocktails", { flavors: ["refreshing"] }),
      step("match_cocktails", { flavors: ["refreshing"] })
    ]);
    const result = await runReActLoop({ text: "清爽的", client, maxSteps: 4 });

    expect(result.outcome.kind).toBe("final_recommendation");
    if (result.outcome.kind === "final_recommendation") {
      expect(result.outcome.args.forced).toBe(true);
    }
  });

  it("throws ReActLoopError when forced to finalize without any match", async () => {
    const client = scriptedClient([
      { thought: "1", action: "make_coffee" as ReActStepDecision["action"], arguments: "{}" },
      { thought: "2", action: "make_coffee" as ReActStepDecision["action"], arguments: "{\"a\":1}" }
    ]);

    await expect(runReActLoop({ text: "你好", client, maxSteps: 4 })).rejects.toThrow(ReActLoopError);
  });

  it("emits trace entries for thinking, tool calls and wrap-up", async () => {
    const traces: string[] = [];
    const client = scriptedClient([
      step("match_cocktails", { flavors: ["refreshing"] }),
      step("final_recommendation", { cocktail_ref: "x", reason: "r", intent: "classic_recommendation" })
    ]);
    await runReActLoop({ text: "清爽的", client, onTrace: (entry) => traces.push(entry.step) });

    expect(traces.some((entry) => entry.startsWith("思考"))).toBe(true);
    expect(traces.some((entry) => entry.startsWith("调用工具"))).toBe(true);
    expect(traces).toContain("ReAct 收尾");
  });
});
