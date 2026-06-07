import { describe, expect, it } from "vitest";
import { cocktails } from "../../src/data/cocktails";
import type { ParsedPreference } from "../../src/domain/preferenceParser";
import type { OpenAILlmClient } from "./openaiClient";
import { generateRecommendationNarrative } from "./recommendationNarrative";

const preference: ParsedPreference = {
  requestType: "classic_recommendation",
  availableIngredients: [],
  flavorPreferences: ["refreshing", "sour", "bubbly"],
  dislikedFlavors: [],
  strengthPreference: "medium",
  difficulty: "easy",
  occasion: "summer"
};

describe("generateRecommendationNarrative", () => {
  it("uses LLM text to generate recommendation reason only", async () => {
    const cocktail = cocktails.find((item) => item.id === "french-75");
    if (!cocktail) throw new Error("missing fixture");

    const client: OpenAILlmClient = {
      generateText: async () => JSON.stringify({
        recommendationReason: "它有柠檬的酸爽和起泡酒的轻盈，适合夏天慢慢喝。"
      }),
      generateJson: async () => {
        throw new Error("not used");
      },
      generateWebJson: async () => {
        throw new Error("not used");
      }
    };

    const result = await generateRecommendationNarrative({
      client,
      cocktail,
      preference,
      fallbackReason: "本地推荐理由"
    });

    expect(result.source).toBe("ai");
    expect(result.recommendationReason).toContain("起泡酒");
    expect(result.cocktailIntro).toBe("");
    expect(result.flavorExpectation).toBe("");
    expect(result.adjustmentTips).toEqual([]);
  });

  it("falls back locally when LLM is unavailable", async () => {
    const cocktail = cocktails.find((item) => item.id === "mojito");
    if (!cocktail) throw new Error("missing fixture");

    const result = await generateRecommendationNarrative({
      client: undefined,
      cocktail,
      preference,
      fallbackReason: "本地推荐理由"
    });

    expect(result.source).toBe("local");
    expect(result.recommendationReason).toBe("本地推荐理由");
    expect(result.cocktailIntro).toBe("");
    expect(result.flavorExpectation).toBe("");
    expect(result.adjustmentTips).toEqual([]);
  });

  it("falls back locally when LLM returns invalid content", async () => {
    const cocktail = cocktails.find((item) => item.id === "paloma");
    if (!cocktail) throw new Error("missing fixture");

    const client: OpenAILlmClient = {
      generateText: async () => "不是 JSON",
      generateJson: async () => {
        throw new Error("not used");
      },
      generateWebJson: async () => {
        throw new Error("not used");
      }
    };

    const result = await generateRecommendationNarrative({
      client,
      cocktail,
      preference,
      fallbackReason: "本地推荐理由"
    });

    expect(result.source).toBe("local");
    expect(result.error).toBeTruthy();
  });

  it("limits generated recommendation reason length", async () => {
    const cocktail = cocktails.find((item) => item.id === "french-75");
    if (!cocktail) throw new Error("missing fixture");

    const client: OpenAILlmClient = {
      generateText: async () => JSON.stringify({
        recommendationReason: "abcdefghijklmnopqrstuvwxyz"
      }),
      generateJson: async () => {
        throw new Error("not used");
      },
      generateWebJson: async () => {
        throw new Error("not used");
      }
    };

    const result = await generateRecommendationNarrative({
      client,
      cocktail,
      preference,
      fallbackReason: "local reason",
      maxReasonChars: 12
    });

    expect(result.source).toBe("ai");
    expect(result.recommendationReason.length).toBeLessThanOrEqual(12);
  });
});
