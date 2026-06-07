import { cocktails } from "../../src/data/cocktails";
import { ingredients } from "../../src/data/ingredients";
import { parseUserPreference, type ParsedPreference } from "../../src/domain/preferenceParser";
import { checkAlcoholSafety, type AlcoholSafetyResult } from "../../src/domain/safety";
import type { OpenAIJsonClient } from "./openaiClient";
import { parseRequestSystemPrompt } from "./prompts";
import { parseRequestSchema } from "./schemas";

type ParseRequestInput = {
  text: string;
  client?: OpenAIJsonClient;
};

export type ParseRequestResult = {
  source: "ai" | "local";
  preference: ParsedPreference;
  safety: AlcoholSafetyResult;
  debug?: {
    fallbackReason?: string;
  };
};

function unique<T>(items: T[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function mergePreference(local: ParsedPreference, ai: ParsedPreference): ParsedPreference {
  return {
    requestType: ai.requestType ?? local.requestType,
    availableIngredients: unique([...(ai.availableIngredients ?? []), ...local.availableIngredients]),
    flavorPreferences: unique([...(ai.flavorPreferences ?? []), ...local.flavorPreferences]),
    dislikedFlavors: unique([...(ai.dislikedFlavors ?? []), ...local.dislikedFlavors]),
    strengthPreference: ai.strengthPreference !== "unknown" ? ai.strengthPreference : local.strengthPreference,
    difficulty: ai.difficulty !== "unknown" ? ai.difficulty : local.difficulty,
    occasion: ai.occasion !== "unknown" ? ai.occasion : local.occasion,
    referenceCocktail: ai.referenceCocktail ?? local.referenceCocktail
  };
}

export async function parseRequestForAgent({ text, client }: ParseRequestInput): Promise<ParseRequestResult> {
  const localPreference = parseUserPreference(text);
  const safety = checkAlcoholSafety(text);

  if (!client || !text.trim()) {
    return {
      source: "local",
      preference: localPreference,
      safety
    };
  }

  try {
    const aiPreference = await client.generateJson<ParsedPreference>({
      system: parseRequestSystemPrompt,
      user: {
        text,
        allowedIngredients: ingredients.map((ingredient) => ({
          id: ingredient.id,
          name: ingredient.name,
          aliases: ingredient.aliases
        })),
        knownCocktails: cocktails.map((cocktail) => ({
          id: cocktail.id,
          name: cocktail.name,
          englishName: cocktail.englishName,
          tags: cocktail.tags
        }))
      },
      schemaName: "cocktail_agent_request_parse",
      schema: parseRequestSchema
    });

    return {
      source: "ai",
      preference: mergePreference(localPreference, aiPreference),
      safety
    };
  } catch (error) {
    return {
      source: "local",
      preference: localPreference,
      safety,
      debug: {
        fallbackReason: error instanceof Error ? error.message : "AI parsing failed"
      }
    };
  }
}
