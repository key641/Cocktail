import { describe, expect, it } from "vitest";
import type { GenerateWebJsonInput, GenerateWebJsonResult, OpenAIJsonClient } from "../ai/openaiClient";
import { runBartenderAgent } from "./bartenderAgent";

function createFakeClient(overrides?: {
  generateText?: OpenAIJsonClient["generateText"];
  generateJson?: OpenAIJsonClient["generateJson"];
  generateWebJson?: <T>(input: GenerateWebJsonInput) => Promise<GenerateWebJsonResult<T>>;
}): OpenAIJsonClient {
  return {
    generateText: overrides?.generateText ?? (async () => JSON.stringify({
      recommendationReason: "AI reason: refreshing and easy."
    })),
    generateJson: overrides?.generateJson ?? (async <T>() => ({
      requestType: "classic_recommendation",
      availableIngredients: [],
      flavorPreferences: [],
      dislikedFlavors: [],
      strengthPreference: "unknown",
      difficulty: "easy",
      occasion: "unknown"
    }) as T),
    generateWebJson: overrides?.generateWebJson ?? (async <T>(): Promise<GenerateWebJsonResult<T>> => ({
      data: {
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
        notes: "Modern classic with reputable recipe sources"
      } as T,
      citations: [{ url: "https://example.com/paper-plane", title: "Paper Plane" }]
    }))
  };
}

describe("runBartenderAgent", () => {
  it("returns a structured bartender response using local tools when no client is available", async () => {
    const result = await runBartenderAgent({
      text: "I have gin, lemon and syrup. I want something refreshing, light and summery.",
      client: undefined
    });

    expect(result.status).toBe("ok");
    expect(result.agentMode).toBe("local_tools");
    expect(result.message).toContain(result.primaryRecommendation?.cocktail.name);
    expect(result.primaryRecommendation?.cocktail.id).toBeTruthy();
    expect(result.recipe?.ingredients.length).toBeGreaterThan(0);
    expect(result.visualSpec?.glassType).toBeTruthy();
    expect(result.followUpActions).toEqual(expect.arrayContaining(["view_recipe", "follow_along"]));
  });

  it("returns the standard recommendation bundle while keeping legacy fields", async () => {
    const result = await runBartenderAgent({
      text: "I want something refreshing and easy",
      client: undefined
    });

    expect(result.intent).toBe("classic_recommendation");
    expect(result.recommendation?.primary.recipeMode).toBe("local");
    expect(result.recommendation?.alternatives.length).toBeGreaterThan(0);
    expect(result.trustSignals[0].type).toBe("local_classic");
    expect(result.primaryRecommendation?.cocktail.id).toBe(result.recommendation?.primary.id);
  });

  it("answers capability smalltalk without forcing a drink recommendation", async () => {
    const result = await runBartenderAgent({
      text: "你好，你能做什么？你的能力范围是什么？",
      client: undefined
    });

    expect(result.status).toBe("ok");
    expect(result.intent).toBe("smalltalk");
    expect(result.message).toContain("随身小酒保");
    expect(result.message).toContain("边界");
    expect(result.recommendation).toBeUndefined();
    expect(result.primaryRecommendation).toBeUndefined();
    expect(result.agentTrace?.some((entry) => entry.step === "能力说明")).toBe(true);
  });

  it("answers greeting smalltalk in a warmer bartender voice", async () => {
    const result = await runBartenderAgent({
      text: "你好",
      client: undefined
    });

    expect(result.intent).toBe("smalltalk");
    expect(result.message).toContain("小酒保");
    expect(result.message).toContain("模糊的口味");
    expect(result.recommendation).toBeUndefined();
  });

  it("answers usage help with copyable examples", async () => {
    const result = await runBartenderAgent({
      text: "这个怎么用？",
      client: undefined
    });

    expect(result.intent).toBe("smalltalk");
    expect(result.message).toContain("可以这样问我");
    expect(result.message).toContain("家里有金酒");
    expect(result.message).toContain("像 Margarita");
    expect(result.recommendation).toBeUndefined();
  });

  it("attaches LLM narrative copy when the client can generate text", async () => {
    const result = await runBartenderAgent({
      text: "I want something refreshing and easy",
      client: createFakeClient()
    });

    expect(result.narrative?.source).toBe("ai");
    expect(result.recommendation?.narrative?.recommendationReason).toContain("refreshing");
    expect(result.recommendation?.reason).toBe(result.narrative?.recommendationReason);
    expect(result.recommendation?.primary.reason).toBe(result.narrative?.recommendationReason);
  });

  it("generates LLM reasons for the primary and alternative chat cards", async () => {
    let calls = 0;
    const result = await runBartenderAgent({
      text: "I want something refreshing and easy",
      client: createFakeClient({
        generateText: async () => {
          calls += 1;
          return JSON.stringify({ recommendationReason: `AI reason ${calls}` });
        }
      })
    });

    expect(calls).toBeGreaterThanOrEqual(3);
    expect(result.recommendation?.primary.reason).toBe("AI reason 1");
    expect(result.recommendation?.alternatives[0]?.reason).toBe("AI reason 2");
    expect(result.alternatives[0]?.reason).toBe("AI reason 2");
  });

  it("does not report AI mode when parsing falls back locally", async () => {
    const result = await runBartenderAgent({
      text: "I want something refreshing, sour, fizzy and good for summer.",
      client: {
        generateText: async () => {
          throw new Error("not used");
        },
        generateJson: async () => {
          throw new Error("network failed");
        },
        generateWebJson: async () => {
          throw new Error("not used");
        }
      }
    });

    expect(result.agentMode).toBe("local_tools");
    expect(result.toolResults.parseSource).toBe("local");
    expect(result.toolResults.fallbackReason).toContain("network failed");
  });

  it("uses external recipe search when the user names a cocktail outside the local menu", async () => {
    const result = await runBartenderAgent({
      text: "Can you make a Paper Plane?",
      client: createFakeClient()
    });

    expect(result.intent).toBe("named_cocktail_lookup");
    expect(result.agentMode).toBe("openai_responses_tools");
    expect(result.recommendation?.primary.recipeMode).toBe("external");
    expect(result.recommendation?.primary.name).toBe("Paper Plane");
    expect(result.citations[0].url).toBe("https://example.com/paper-plane");
  });

  it("uses IBA-only search when the user asks for an official recipe", async () => {
    let allowedDomains: string[] | undefined;
    const client = createFakeClient({
      generateWebJson: async <T>(input: GenerateWebJsonInput): Promise<GenerateWebJsonResult<T>> => {
        allowedDomains = input.allowedDomains;
        return {
          data: {
            sourceType: "iba_official",
            cocktailName: "Mojito",
            ingredients: [{ name: "White rum", amount: "45 ml" }],
            steps: ["Build in glass"],
            glass: "Highball",
            garnish: "Mint",
            confidence: 0.95,
            notes: "Official source"
          } as T,
          citations: [{ url: "https://iba-world.com/mojito/", title: "Mojito" }]
        };
      }
    });

    const result = await runBartenderAgent({
      text: "What is the official IBA Mojito recipe?",
      client
    });

    expect(result.intent).toBe("official_recipe_check");
    expect(allowedDomains).toEqual(["iba-world.com"]);
    expect(result.trustSignals[0].type).toBe("iba_source");
    expect(result.citations[0].sourceType).toBe("iba_official");
  });

  it("can attach a classic twist suggestion when the user asks for a lighter version", async () => {
    const result = await runBartenderAgent({
      text: "I want something like a Negroni but less bitter and lighter.",
      client: createFakeClient({
        generateJson: async <T>() => ({
          requestType: "classic_twist",
          availableIngredients: [],
          flavorPreferences: ["refreshing"],
          dislikedFlavors: ["bitter"],
          strengthPreference: "low",
          difficulty: "easy",
          occasion: "unknown",
          referenceCocktail: "negroni"
        }) as T
      })
    });

    expect(result.status).toBe("ok");
    expect(result.twist?.disclaimer).toBeTruthy();
  });

});
