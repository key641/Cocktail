import { cocktails } from "../../src/data/cocktails";
import { getIngredientName } from "../../src/data/ingredients";
import { getCocktailVisualSpec } from "../../src/data/cocktailVisuals";
import type { ParsedPreference } from "../../src/domain/preferenceParser";
import type { CocktailRecommendation } from "../../src/domain/types";
import type {
  AgentDrinkCandidate,
  AgentIntent,
  AgentRecommendationBundle,
  AgentSessionState,
  Citation,
  ExternalRecipeSearchResult,
  TrustSignal
} from "./types";

const officialRecipePattern = /official|standard|authentic|iba|正宗|官方|标准|標準/i;
const weakCoveragePattern = /smoky|smoke|salty|salted|tea|hot drink|mocktail|non[- ]?alcohol|烟熏|煙燻|咸|鹹|茶|热饮|熱飲|无酒精|無酒精/i;

export type RecommendationConfidence = {
  score: number;
  level: "high" | "medium" | "low";
  reasons: string[];
  shouldSearchExternal: boolean;
};

export function createEmptySession(): AgentSessionState {
  return {
    preferredFlavors: [],
    dislikedFlavors: [],
    availableIngredients: [],
    lastRecommendationIds: [],
    rejectedRecommendationIds: []
  };
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

export function mergeAgentSession(preference: ParsedPreference, session?: AgentSessionState): AgentSessionState {
  const base = session ?? createEmptySession();
  return {
    ...base,
    preferredFlavors: unique([...base.preferredFlavors, ...preference.flavorPreferences]),
    dislikedFlavors: unique([...base.dislikedFlavors, ...preference.dislikedFlavors]),
    preferredStrength: preference.strengthPreference === "unknown" ? base.preferredStrength : preference.strengthPreference,
    availableIngredients: unique([...base.availableIngredients, ...preference.availableIngredients])
  };
}

export function findLocalCocktailByText(text: string) {
  const normalized = text.toLowerCase();
  return cocktails.find((cocktail) => (
    normalized.includes(cocktail.id) ||
    normalized.includes(cocktail.englishName.toLowerCase()) ||
    normalized.includes(cocktail.name.toLowerCase())
  ));
}

export function extractRequestedCocktailName(text: string) {
  const local = findLocalCocktailByText(text);
  if (local) return local.englishName;

  const quoted = text.match(/["'“”‘’]([^"'“”‘’]{2,40})["'“”‘’]/)?.[1];
  if (quoted) return quoted.trim();

  const commonSentenceStarts = new Set(["Can", "Could", "What", "Please", "I", "The", "A", "An"]);
  const candidates = Array.from(text.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/g))
    .map((match) => match[1].trim())
    .filter((candidate) => !commonSentenceStarts.has(candidate))
    .sort((a, b) => b.split(/\s+/).length - a.split(/\s+/).length || b.length - a.length);
  const englishName = candidates[0];
  return englishName?.trim();
}

export function routeAgentIntent({
  text,
  preference,
  safetyBlocked
}: {
  text: string;
  preference: ParsedPreference;
  safetyBlocked: boolean;
}): AgentIntent {
  if (safetyBlocked) return "safe_mocktail";
  if (preference.requestType === "menu_share") return "share_caption";
  if (officialRecipePattern.test(text)) return "official_recipe_check";
  if (preference.requestType === "classic_twist") return "classic_twist";

  const requestedName = extractRequestedCocktailName(text);
  if (requestedName && !findLocalCocktailByText(text)) {
    return "named_cocktail_lookup";
  }

  if (preference.requestType === "ingredient_matching") return "ingredient_matching";
  if (weakCoveragePattern.test(text)) return "external_inspiration";
  return "classic_recommendation";
}

export function evaluateRecommendationConfidence({
  text,
  preference,
  recommendation
}: {
  text: string;
  preference: ParsedPreference;
  recommendation: CocktailRecommendation;
}): RecommendationConfidence {
  const reasons: string[] = [];
  let score = 70;

  if (weakCoveragePattern.test(text)) {
    score -= 35;
    reasons.push("User asked for a flavor or occasion that is weakly covered by the local menu.");
  }

  if (recommendation.missingIngredients.length >= 3) {
    score -= 20;
    reasons.push("The best local candidate still misses several ingredients.");
  }

  const dislikedOverlap = preference.dislikedFlavors.filter((flavor) => recommendation.cocktail.tags.join(" ").toLowerCase().includes(flavor));
  if (dislikedOverlap.length) {
    score -= 30;
    reasons.push("The best local candidate conflicts with a disliked flavor.");
  }

  if (preference.strengthPreference === "low" && recommendation.cocktail.strength === "strong") {
    score -= 20;
    reasons.push("The best local candidate is stronger than requested.");
  }

  const clamped = Math.max(0, Math.min(100, score));
  const level = clamped >= 70 ? "high" : clamped >= 45 ? "medium" : "low";

  return {
    score: clamped,
    level,
    reasons,
    shouldSearchExternal: level === "low"
  };
}

export function localRecommendationToCandidate(recommendation: CocktailRecommendation): AgentDrinkCandidate {
  const { cocktail } = recommendation;
  return {
    id: cocktail.id,
    name: cocktail.name,
    englishName: cocktail.englishName,
    recipeMode: "local",
    source: "local_classic",
    confidence: Math.max(0, Math.min(1, recommendation.score / 100)),
    tags: cocktail.tags,
    reason: recommendation.reason,
    recipe: {
      ingredients: cocktail.ingredients.map((ingredient) => ({
        id: ingredient.ingredientId,
        name: getIngredientName(ingredient.ingredientId),
        amount: ingredient.amount,
        optional: ingredient.optional
      })),
      steps: cocktail.steps,
      glass: cocktail.glass,
      garnish: cocktail.garnish,
      bartenderTip: cocktail.bartenderTip
    },
    visualSpec: getCocktailVisualSpec(cocktail.id)
  };
}

export function externalRecipeToCandidate(result: ExternalRecipeSearchResult): AgentDrinkCandidate {
  return {
    id: `external-${result.cocktailName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cocktail"}`,
    name: result.cocktailName,
    englishName: result.cocktailName,
    recipeMode: "external",
    source: result.sourceType === "web_unverified" ? "external_inspiration" : "external_verified",
    sourceType: result.sourceType,
    confidence: result.confidence,
    tags: result.sourceType === "iba_official" ? ["IBA", "外部查证"] : ["外部查证"],
    reason: result.notes,
    recipe: {
      ingredients: result.ingredients.map((ingredient) => ({ name: ingredient.name, amount: ingredient.amount })),
      steps: result.steps,
      glass: result.glass,
      garnish: result.garnish,
      bartenderTip: result.notes
    },
    displayVisualFallback: {
      glass: result.glass,
      garnish: result.garnish ? [result.garnish] : undefined
    }
  };
}

export function buildRecommendationBundle({
  primary,
  alternatives,
  reason,
  narrative,
  ownedIngredients,
  missingIngredients,
  difficulty
}: {
  primary: AgentDrinkCandidate;
  alternatives: AgentDrinkCandidate[];
  reason: string;
  narrative?: AgentRecommendationBundle["narrative"];
  ownedIngredients: string[];
  missingIngredients: string[];
  difficulty: AgentRecommendationBundle["executableInfo"]["difficulty"];
}): AgentRecommendationBundle {
  return {
    primary,
    alternatives,
    reason,
    narrative,
    executableInfo: {
      ownedIngredients,
      missingIngredients,
      difficulty,
      estimatedMinutes: primary.recipe?.steps.length ? Math.max(3, primary.recipe.steps.length * 2) : undefined
    }
  };
}

export function trustSignalsForSource(sourceType?: ExternalRecipeSearchResult["sourceType"], source?: AgentDrinkCandidate["source"]): TrustSignal[] {
  if (source === "local_classic") {
    return [{ type: "local_classic", label: "经典酒库" }];
  }
  if (source === "classic_twist") {
    return [
      { type: "classic_twist", label: "经典结构改编" },
      { type: "not_official", label: "非官方配方" }
    ];
  }
  if (sourceType === "iba_official") {
    return [{ type: "iba_source", label: "来源：IBA" }];
  }
  if (sourceType === "reputable_site") {
    return [{ type: "external_source", label: "外部查证" }];
  }
  return [{ type: "uncertain", label: "待确认" }];
}

export function citationsFromExternalResult(result?: ExternalRecipeSearchResult): Citation[] {
  return result?.citations.map((citation) => ({
    ...citation,
    sourceType: result.sourceType
  })) ?? [];
}
