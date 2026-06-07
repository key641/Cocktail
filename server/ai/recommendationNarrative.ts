import { getIngredientName } from "../../src/data/ingredients";
import type { ParsedPreference } from "../../src/domain/preferenceParser";
import type { Cocktail } from "../../src/domain/types";
import type { OpenAILlmClient } from "./openaiClient";

export type RecommendationNarrative = {
  source: "ai" | "local";
  recommendationReason: string;
  cocktailIntro: string;
  flavorExpectation: string;
  adjustmentTips: string[];
  error?: string;
};

type GenerateRecommendationNarrativeInput = {
  client?: OpenAILlmClient;
  cocktail: Cocktail;
  preference: ParsedPreference;
  fallbackReason: string;
  maxReasonChars?: number;
};

const DEFAULT_MAX_REASON_CHARS = 56;

function safeParseJsonObject(text: string): Partial<RecommendationNarrative> {
  const trimmed = text.trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd < jsonStart) {
    throw new Error("LLM narrative did not return JSON.");
  }

  return JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as Partial<RecommendationNarrative>;
}

function limitText(text: string, maxLength: number) {
  const normalized = text.trim();
  if (!normalized || maxLength <= 0) return "";
  if (normalized.length <= maxLength) return normalized;
  if (maxLength === 1) return "…";
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function buildLocalNarrative(fallbackReason: string, maxReasonChars: number, error?: string): RecommendationNarrative {
  return {
    source: "local",
    recommendationReason: limitText(fallbackReason, maxReasonChars),
    cocktailIntro: "",
    flavorExpectation: "",
    adjustmentTips: [],
    error
  };
}

export async function generateRecommendationNarrative({
  client,
  cocktail,
  preference,
  fallbackReason,
  maxReasonChars = DEFAULT_MAX_REASON_CHARS
}: GenerateRecommendationNarrativeInput): Promise<RecommendationNarrative> {
  if (!client) {
    return buildLocalNarrative(fallbackReason, maxReasonChars);
  }

  try {
    const reply = await client.generateText({
      system: [
        "你是一个中文鸡尾酒推荐文案助手。",
        "你只负责生成推荐理由，不改配方，不新增材料。",
        "不要把经典 twist 说成官方配方。",
        "不要鼓励过量饮酒、拼酒或快速饮酒。",
        "返回一个 JSON 对象，不要输出 JSON 之外的文字。",
        "字段：recommendationReason。",
        `recommendationReason 控制在 ${maxReasonChars} 个中文字符以内，1 到 2 句，优雅、克制、具体。`
      ].join("\n"),
      user: {
        cocktail: {
          id: cocktail.id,
          name: cocktail.name,
          englishName: cocktail.englishName,
          tags: cocktail.tags,
          strength: cocktail.strength,
          glass: cocktail.glass,
          ingredients: cocktail.ingredients.map((ingredient) => ({
            name: getIngredientName(ingredient.ingredientId),
            amount: ingredient.amount,
            optional: ingredient.optional ?? false
          }))
        },
        preference: {
          requestType: preference.requestType,
          flavorPreferences: preference.flavorPreferences,
          dislikedFlavors: preference.dislikedFlavors,
          strengthPreference: preference.strengthPreference,
          difficulty: preference.difficulty,
          occasion: preference.occasion,
          availableIngredients: preference.availableIngredients.map(getIngredientName)
        },
        localReason: fallbackReason
      },
      temperature: 0.45
    });

    const parsed = safeParseJsonObject(reply);
    const recommendationReason = typeof parsed.recommendationReason === "string"
      ? limitText(parsed.recommendationReason, maxReasonChars)
      : "";

    if (!recommendationReason) {
      throw new Error("LLM narrative missed required fields.");
    }

    return {
      source: "ai",
      recommendationReason,
      cocktailIntro: "",
      flavorExpectation: "",
      adjustmentTips: []
    };
  } catch (error) {
    return buildLocalNarrative(
      fallbackReason,
      maxReasonChars,
      error instanceof Error ? error.message : "LLM narrative generation failed."
    );
  }
}
