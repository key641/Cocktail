import { retrieveCocktailCandidates } from "../../src/domain/cocktailRetrieval";
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
    resolution?: "deterministic" | "model" | "fallback";
    latencyMs?: number;
    candidateCocktailIds?: string[];
    requestChars?: number;
  };
};

function unique<T>(items: T[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}

function mergePreference(local: ParsedPreference, ai: ParsedPreference): ParsedPreference {
  const requestTypes = ["classic_recommendation", "recipe_lookup", "classic_twist", "ingredient_matching", "substitution", "menu_share", "smalltalk"] as const;
  const actions = ["recommend", "recipe", "twist", "substitute", "share", "smalltalk"] as const;
  const flavors = ["refreshing", "sour", "sweet", "bitter", "fruity", "herbal", "creamy", "bubbly"] as const;
  const strengths = ["low", "medium", "high", "unknown"] as const;
  const difficulties = ["easy", "normal", "professional", "unknown"] as const;
  const occasions = ["summer", "date", "party", "aperitif", "after_dinner", "home", "unknown"] as const;
  const aiAction = oneOf(ai.action, actions) ? ai.action : undefined;
  const action = local.action && local.action !== "recommend" ? local.action : aiAction ?? local.action;
  const localRequestTypeHasEvidence = local.requestType === "recipe_lookup"
    || local.requestType === "ingredient_matching"
    || local.requestType === "classic_twist"
    || local.requestType === "substitution"
    || local.requestType === "menu_share"
    || local.requestType === "smalltalk";
  return {
    requestType: localRequestTypeHasEvidence
      ? local.requestType
      : oneOf(ai.requestType, requestTypes) ? ai.requestType : local.requestType,
    action,
    availableIngredients: unique([...(ai.availableIngredients ?? []), ...local.availableIngredients]),
    flavorPreferences: unique([...(ai.flavorPreferences ?? []).filter((value) => oneOf(value, flavors)), ...local.flavorPreferences]),
    dislikedFlavors: unique([...(ai.dislikedFlavors ?? []).filter((value) => oneOf(value, flavors)), ...local.dislikedFlavors]),
    strengthPreference: oneOf(ai.strengthPreference, strengths) && ai.strengthPreference !== "unknown"
      ? ai.strengthPreference
      : local.strengthPreference,
    difficulty: oneOf(ai.difficulty, difficulties) && ai.difficulty !== "unknown" ? ai.difficulty : local.difficulty,
    occasion: oneOf(ai.occasion, occasions) && ai.occasion !== "unknown" ? ai.occasion : local.occasion,
    referenceCocktail: local.referenceCocktail ?? (typeof ai.referenceCocktail === "string" ? ai.referenceCocktail : undefined)
  };
}

export async function parseRequestForAgent({ text, client }: ParseRequestInput): Promise<ParseRequestResult> {
  const startedAt = Date.now();
  const localPreference = parseUserPreference(text);
  const safety = checkAlcoholSafety(text);
  const candidates = retrieveCocktailCandidates(text);
  const candidateCocktailIds = candidates.map((candidate) => candidate.cocktail.id);
  const canResolveDeterministically = safety.shouldAvoidAlcohol
    || (localPreference.action === "recipe" && Boolean(localPreference.referenceCocktail))
    || localPreference.availableIngredients.length > 0
    || localPreference.flavorPreferences.length >= 2
    || (localPreference.flavorPreferences.length >= 1 && candidates[0]?.score >= 30);

  if (!client || !text.trim() || canResolveDeterministically) {
    return {
      source: "local",
      preference: localPreference,
      safety,
      debug: {
        resolution: canResolveDeterministically ? "deterministic" : "fallback",
        latencyMs: Date.now() - startedAt,
        candidateCocktailIds
      }
    };
  }

  try {
    const user = {
      text,
      locallyDetectedIngredients: localPreference.availableIngredients,
      locallyDetectedAction: localPreference.action,
      locallyDetectedCocktail: localPreference.referenceCocktail ?? null,
      candidateCocktails: candidates.map(({ cocktail, evidence }) => ({
        id: cocktail.id,
        name: cocktail.name,
        englishName: cocktail.englishName,
        tags: cocktail.tags,
        evidence
      }))
    };
    const aiPreference = await client.generateJson<ParsedPreference>({
      system: parseRequestSystemPrompt,
      user,
      schemaName: "cocktail_agent_request_parse",
      schema: parseRequestSchema
    });

    return {
      source: "ai",
      preference: mergePreference(localPreference, aiPreference),
      safety,
      debug: {
        resolution: "model",
        latencyMs: Date.now() - startedAt,
        candidateCocktailIds,
        requestChars: JSON.stringify(user).length
      }
    };
  } catch (error) {
    return {
      source: "local",
      preference: localPreference,
      safety,
      debug: {
        fallbackReason: error instanceof Error ? error.message : "AI parsing failed",
        resolution: "fallback",
        latencyMs: Date.now() - startedAt,
        candidateCocktailIds,
        requestChars: JSON.stringify({
          text,
          locallyDetectedIngredients: localPreference.availableIngredients,
          candidateCocktailIds
        }).length
      }
    };
  }
}
