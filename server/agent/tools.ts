import { cocktails } from "../../src/data/cocktails";
import { getCocktailVisualSpec } from "../../src/data/cocktailVisuals";
import { getIngredientName } from "../../src/data/ingredients";
import {
  buildAgentRecommendation,
  moodFromPreference,
  strengthFromPreference,
  tasteFromPreference
} from "../../src/domain/agentFlow";
import { buildBartenderOneLiner, buildUnderstandingSummary } from "../../src/domain/agentNarrative";
import { generateShareCaption, type CaptionStyle } from "../../src/domain/captionGenerator";
import { rankForExploration, recommendByIngredients } from "../../src/domain/recommendation";
import { checkAlcoholSafety } from "../../src/domain/safety";
import { suggestTwist } from "../../src/domain/twistEngine";
import type { ParsedPreference } from "../../src/domain/preferenceParser";
import type { CocktailRecommendation } from "../../src/domain/types";
import type { TwistInput } from "../../src/domain/twistEngine";
import type { OpenAIJsonClient } from "../ai/openaiClient";
import type { ExternalInspirationSearchResult, ExternalRecipeSearchResult } from "./types";

function findCocktail(cocktailId: string) {
  return cocktails.find((cocktail) => cocktail.id === cocktailId);
}

export function safetyCheckTool(text: string) {
  return checkAlcoholSafety(text);
}

export function matchCocktailsTool(preference: ParsedPreference, semanticQuery?: string) {
  const result = buildAgentRecommendation({
    cocktails,
    preference,
    semanticQuery
  });

  const tasteProfile = tasteFromPreference(preference);
  const alternatives = preference.availableIngredients.length > 0 || preference.requestType === "ingredient_matching"
    ? recommendByIngredients({
      cocktails,
      ownedIngredientIds: preference.availableIngredients,
      tasteProfile
    })
    : rankForExploration({
      cocktails,
      mood: moodFromPreference(preference),
      preferredStrength: strengthFromPreference(preference.strengthPreference),
      tasteProfile,
      semanticQuery
    });

  return {
    primaryRecommendation: result.recommendation,
    alternatives: alternatives
      .filter((candidate) => candidate.cocktail.id !== result.recommendation.cocktail.id)
      .slice(0, 2),
    ownedIngredients: result.ownedIngredients
  };
}

export function getCocktailRecipeTool(cocktailId: string) {
  const cocktail = findCocktail(cocktailId);
  if (!cocktail) {
    return undefined;
  }

  return {
    cocktail,
    ingredients: cocktail.ingredients.map((ingredient) => ({
      id: ingredient.ingredientId,
      name: getIngredientName(ingredient.ingredientId),
      amount: ingredient.amount,
      optional: ingredient.optional ?? false
    })),
    steps: cocktail.steps,
    bartenderTip: cocktail.bartenderTip
  };
}

export function suggestClassicTwistTool(cocktailId: string, input: TwistInput) {
  const cocktail = findCocktail(cocktailId);
  if (!cocktail) {
    return undefined;
  }

  return suggestTwist(cocktail, input);
}

export function generateShareCaptionTool(cocktailId: string, style: CaptionStyle) {
  const cocktail = findCocktail(cocktailId);
  if (!cocktail) {
    return undefined;
  }

  return generateShareCaption({
    cocktail,
    style,
    occasion: "今晚",
    userLevel: "这次尝试"
  });
}

export function getVisualSpecTool(cocktailId: string) {
  return getCocktailVisualSpec(cocktailId);
}

const externalRecipeSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    sourceType: { type: "string", enum: ["iba_official", "reputable_site", "web_unverified"] },
    cocktailName: { type: "string" },
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
    glass: { type: "string" },
    garnish: { type: "string" },
    confidence: { type: "number" },
    notes: { type: "string" }
  },
  required: ["sourceType", "cocktailName", "ingredients", "steps", "glass", "garnish", "confidence", "notes"]
} as const;

const externalInspirationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    candidates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          sourceType: { type: "string", enum: ["iba_official", "reputable_site", "web_unverified"] },
          cocktailName: { type: "string" },
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
          glass: { type: "string" },
          garnish: { type: "string" },
          confidence: { type: "number" },
          notes: { type: "string" }
        },
        required: ["sourceType", "cocktailName", "ingredients", "steps", "glass", "garnish", "confidence", "notes"]
      }
    },
    notes: { type: "string" }
  },
  required: ["candidates", "notes"]
} as const;

export async function searchCocktailRecipeTool({
  query,
  officialOnly = false,
  client
}: {
  query: string;
  officialOnly?: boolean;
  client?: OpenAIJsonClient;
}): Promise<ExternalRecipeSearchResult> {
  if (!client) {
    return {
      status: "unavailable",
      sourceType: "web_unverified",
      cocktailName: query,
      ingredients: [],
      steps: [],
      citations: [],
      confidence: 0,
      notes: "External recipe search requires OPENAI_API_KEY and the OpenAI web_search tool."
    };
  }

  try {
    const result = await client.generateWebJson<Omit<ExternalRecipeSearchResult, "status" | "citations" | "sourceUrl">>({
      system: [
        "You are a cocktail recipe verification tool.",
        "Search the web for a classic cocktail recipe.",
        "Prefer IBA official sources when available.",
        "Return only structured JSON. Do not invent ingredients.",
        "If the source is not IBA, mark it as reputable_site or web_unverified and lower confidence."
      ].join("\n"),
      user: {
        query,
        officialOnly,
        localKnownCocktails: cocktails.map((cocktail) => ({
          id: cocktail.id,
          name: cocktail.name,
          englishName: cocktail.englishName
        }))
      },
      schemaName: "external_cocktail_recipe",
      schema: externalRecipeSchema,
      allowedDomains: officialOnly ? ["iba-world.com"] : undefined
    });

    return {
      status: "found",
      ...result.data,
      sourceUrl: result.citations[0]?.url,
      citations: result.citations
    };
  } catch (error) {
    return {
      status: "failed",
      sourceType: "web_unverified",
      cocktailName: query,
      ingredients: [],
      steps: [],
      citations: [],
      confidence: 0,
      notes: error instanceof Error ? error.message : "External recipe search failed."
    };
  }
}

export async function searchCocktailInspirationTool({
  query,
  client
}: {
  query: string;
  client?: OpenAIJsonClient;
}): Promise<ExternalInspirationSearchResult> {
  if (!client) {
    return {
      status: "unavailable",
      candidates: [],
      citations: [],
      notes: "External inspiration search requires OPENAI_API_KEY and the OpenAI web_search tool."
    };
  }

  try {
    const result = await client.generateWebJson<Pick<ExternalInspirationSearchResult, "candidates" | "notes">>({
      system: [
        "You are a cocktail research tool for a beginner-friendly cocktail app.",
        "Search the web for classic or modern classic cocktail candidates that match the user's desired feeling.",
        "Do not invent original recipes.",
        "Prefer known cocktails with reputable recipe sources.",
        "Return at most three candidates.",
        "If the source is weak, mark sourceType as web_unverified and keep confidence below 0.55."
      ].join("\n"),
      user: {
        query,
        localKnownCocktails: cocktails.map((cocktail) => ({
          id: cocktail.id,
          name: cocktail.name,
          englishName: cocktail.englishName,
          tags: cocktail.tags
        }))
      },
      schemaName: "external_cocktail_inspiration",
      schema: externalInspirationSchema
    });

    return {
      status: "found",
      candidates: result.data.candidates.slice(0, 3),
      notes: result.data.notes,
      citations: result.citations
    };
  } catch (error) {
    return {
      status: "failed",
      candidates: [],
      citations: [],
      notes: error instanceof Error ? error.message : "External inspiration search failed."
    };
  }
}

export function buildAgentMessageTool({
  preference,
  recommendation,
  missingIngredients
}: {
  preference: ParsedPreference;
  recommendation: CocktailRecommendation;
  missingIngredients: string[];
}) {
  const line = buildBartenderOneLiner({
    preference,
    cocktail: recommendation.cocktail,
    missingIngredients
  });

  const missingText = missingIngredients.length
    ? `需要补 ${missingIngredients.map(getIngredientName).join("、")}。`
    : "你手边的材料已经可以开始。";

  return `${line}${missingText}`;
}

export function understandingTool(preference: ParsedPreference) {
  return buildUnderstandingSummary(preference);
}
