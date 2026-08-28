import type { CocktailVisualSpec } from "./types";

export type AgentIntent =
  | "classic_recommendation"
  | "ingredient_matching"
  | "named_cocktail_lookup"
  | "official_recipe_check"
  | "classic_twist"
  | "external_inspiration"
  | "share_caption"
  | "safe_mocktail"
  | "smalltalk"
  | "clarification";

export type AgentClarification = {
  question: string;
  options: string[];
};

export type TrustSignal = {
  type: "local_classic" | "iba_source" | "external_source" | "classic_twist" | "not_official" | "uncertain";
  label: string;
  description?: string;
};

export type Citation = {
  title?: string;
  url: string;
  sourceType: "iba_official" | "reputable_site" | "web_unverified";
};

export type AgentDrinkCandidate = {
  id: string;
  name: string;
  englishName?: string;
  recipeMode: "local" | "external";
  source: "local_classic" | "external_verified" | "external_inspiration" | "classic_twist";
  sourceType?: "iba_official" | "reputable_site" | "web_unverified";
  confidence: number;
  tags: string[];
  reason: string;
  recipe?: {
    ingredients: Array<{ id?: string; name: string; amount: string; optional?: boolean }>;
    steps: string[];
    glass?: string;
    garnish?: string;
    bartenderTip?: string;
  };
  visualSpec?: CocktailVisualSpec;
  displayVisualFallback?: {
    glass?: string;
    drinkColor?: string;
    garnish?: string[];
  };
};

export type RecommendationNarrative = {
  source: "ai" | "local";
  recommendationReason: string;
  cocktailIntro: string;
  flavorExpectation: string;
  adjustmentTips: string[];
  error?: string;
};

export type AgentRecommendationBundle = {
  primary: AgentDrinkCandidate;
  alternatives: AgentDrinkCandidate[];
  reason: string;
  narrative?: RecommendationNarrative;
  executableInfo: {
    ownedIngredients: string[];
    missingIngredients: string[];
    difficulty: "easy" | "normal" | "professional" | "unknown";
    estimatedMinutes?: number;
  };
};

export type AgentSessionState = {
  preferredFlavors: string[];
  dislikedFlavors: string[];
  preferredStrength?: "low" | "medium" | "high";
  availableIngredients: string[];
  lastRecommendationIds: string[];
  rejectedRecommendationIds: string[];
};
