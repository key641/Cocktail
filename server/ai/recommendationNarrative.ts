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

type NarrativeCandidateInput = {
  cocktail: Cocktail;
  fallbackReason: string;
};

type GenerateRecommendationNarrativeBatchInput = {
  client?: OpenAILlmClient;
  preference: ParsedPreference;
  fallbackMessage: string;
  primary: NarrativeCandidateInput;
  alternatives: NarrativeCandidateInput[];
  maxMessageChars?: number;
  maxReasonChars?: number;
};

export type RecommendationNarrativeBatch = {
  source: "ai" | "local";
  message: string;
  primary: RecommendationNarrative;
  alternatives: RecommendationNarrative[];
  error?: string;
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

function cocktailPayload(cocktail: Cocktail) {
  return {
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
  };
}

export async function generateRecommendationNarrativeBatch({
  client,
  preference,
  fallbackMessage,
  primary,
  alternatives,
  maxMessageChars = 88,
  maxReasonChars = DEFAULT_MAX_REASON_CHARS
}: GenerateRecommendationNarrativeBatchInput): Promise<RecommendationNarrativeBatch> {
  const localResult = (error?: string): RecommendationNarrativeBatch => ({
    source: "local",
    message: fallbackMessage,
    primary: buildLocalNarrative(primary.fallbackReason, maxReasonChars, error),
    alternatives: alternatives.map((item) => buildLocalNarrative(item.fallbackReason, maxReasonChars, error)),
    error
  });

  if (!client) return localResult();

  try {
    const reply = await client.generateText({
      system: [
        "你是一个中文鸡尾酒推荐文案助手。",
        "一次完成聊天主回复与推荐卡片理由，不改配方、不新增材料。",
        "表达自然、克制、具体，像专业酒保，不使用‘今晚的状态很明确’等空泛套话。",
        "用户没有提供手边材料时，不要说‘缺少’或‘补齐全部材料’。",
        "不要重复罗列卡片里已经展示的完整配方。",
        "不要鼓励过量饮酒、拼酒或快速饮酒。",
        "只返回 JSON 对象，字段为 message、primaryReason、alternativeReasons。",
        `message 不超过 ${maxMessageChars} 个中文字符。`,
        `primaryReason 与每条 alternativeReasons 不超过 ${maxReasonChars} 个中文字符。`,
        "alternativeReasons 必须按输入 alternatives 的顺序返回。"
      ].join("\n"),
      user: {
        preference: {
          requestType: preference.requestType,
          flavorPreferences: preference.flavorPreferences,
          dislikedFlavors: preference.dislikedFlavors,
          strengthPreference: preference.strengthPreference,
          difficulty: preference.difficulty,
          occasion: preference.occasion,
          availableIngredients: preference.availableIngredients.map(getIngredientName)
        },
        fallbackMessage,
        primary: cocktailPayload(primary.cocktail),
        alternatives: alternatives.map((item) => cocktailPayload(item.cocktail))
      },
      temperature: 0.35,
      maxTokens: 320
    });

    const parsed = safeParseJsonObject(reply) as {
      message?: unknown;
      primaryReason?: unknown;
      alternativeReasons?: unknown;
    };
    const message = typeof parsed.message === "string" ? limitText(parsed.message, maxMessageChars) : "";
    const primaryReason = typeof parsed.primaryReason === "string"
      ? limitText(parsed.primaryReason, maxReasonChars)
      : "";
    const alternativeReasons = Array.isArray(parsed.alternativeReasons)
      ? parsed.alternativeReasons.map((item) => typeof item === "string" ? limitText(item, maxReasonChars) : "")
      : [];

    if (!message || !primaryReason) {
      throw new Error("LLM narrative batch missed required fields.");
    }

    return {
      source: "ai",
      message,
      primary: {
        source: "ai",
        recommendationReason: primaryReason,
        cocktailIntro: "",
        flavorExpectation: "",
        adjustmentTips: []
      },
      alternatives: alternatives.map((item, index) => ({
        source: alternativeReasons[index] ? "ai" : "local",
        recommendationReason: alternativeReasons[index] || limitText(item.fallbackReason, maxReasonChars),
        cocktailIntro: "",
        flavorExpectation: "",
        adjustmentTips: []
      }))
    };
  } catch (error) {
    return localResult(error instanceof Error ? error.message : "LLM narrative batch generation failed.");
  }
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
        cocktail: cocktailPayload(cocktail),
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
      temperature: 0.35,
      maxTokens: 160
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
