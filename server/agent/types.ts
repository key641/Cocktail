import type { ParseRequestResult } from "../ai/parseRequest";
import type { ShareCaption } from "../../src/domain/captionGenerator";
import type { CocktailVisualSpec } from "../../src/domain/types";
import type { CocktailRecommendation } from "../../src/domain/types";
import type { TwistSuggestion } from "../../src/domain/twistEngine";
import type { RecommendationNarrative } from "../ai/recommendationNarrative";

export type AgentMode = "local_tools" | "openai_responses_tools" | "openai_agents_sdk";

export type AgentIntent =
  | "classic_recommendation"
  | "ingredient_matching"
  | "recipe_lookup"
  | "named_cocktail_lookup"
  | "official_recipe_check"
  | "classic_twist"
  | "external_inspiration"
  | "share_caption"
  | "safe_mocktail"
  | "smalltalk"
  | "clarification";

export type AgentFollowUpAction =
  | "view_recipe"
  | "follow_along"
  | "try_another"
  | "open_ingredients"
  | "safe_mocktail"
  | "lower_alcohol"
  | "sweeter"
  | "verify_recipe";

export type BartenderAgentInput = {
  text: string;
  session?: AgentSessionState;
};

export type ExternalRecipeSearchResult = {
  status: "found" | "unavailable" | "failed";
  sourceType: "iba_official" | "reputable_site" | "web_unverified";
  cocktailName: string;
  ingredients: Array<{ name: string; amount: string }>;
  steps: string[];
  glass?: string;
  garnish?: string;
  sourceUrl?: string;
  citations: Array<{ url: string; title?: string }>;
  confidence: number;
  notes: string;
};

export type ExternalInspirationSearchResult = {
  status: "found" | "unavailable" | "failed";
  candidates: Array<{
    sourceType: "iba_official" | "reputable_site" | "web_unverified";
    cocktailName: string;
    ingredients: Array<{ name: string; amount: string }>;
    steps: string[];
    glass?: string;
    garnish?: string;
    confidence: number;
    notes: string;
  }>;
  citations: Array<{ url: string; title?: string }>;
  notes: string;
};

export type Citation = {
  title?: string;
  url: string;
  sourceType: "iba_official" | "reputable_site" | "web_unverified";
};

export type TrustSignal = {
  type: "local_classic" | "iba_source" | "external_source" | "classic_twist" | "not_official" | "uncertain";
  label: string;
  description?: string;
};

export type AgentRecipe = {
  ingredients: Array<{ id?: string; name: string; amount: string; optional?: boolean }>;
  steps: string[];
  glass?: string;
  garnish?: string;
  bartenderTip?: string;
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
  recipe?: AgentRecipe;
  visualSpec?: CocktailVisualSpec;
  displayVisualFallback?: {
    glass?: string;
    drinkColor?: string;
    garnish?: string[];
  };
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

export type AgentDebugInfo = {
  confidence?: {
    score: number;
    level: "high" | "medium" | "low";
    reasons: string[];
    shouldSearchExternal: boolean;
  };
  externalSearchStatus?: ExternalRecipeSearchResult["status"];
};

export type BartenderAgentToolResults = {
  parseSource: ParseRequestResult["source"];
  fallbackReason?: string;
  preference: ParseRequestResult["preference"];
  safety: ParseRequestResult["safety"];
  ownedIngredients: string[];
};

export type AgentTraceEntry = {
  step: string;
  detail: string;
  data?: unknown;
};

export type AgentClarification = {
  question: string;
  options: string[];
};

export type BartenderAgentResponse = {
  status: "ok" | "safety_blocked" | "needs_confirmation";
  agentMode: AgentMode;
  intent: AgentIntent;
  message: string;
  bartenderJudgement: string;
  clarification?: AgentClarification;
  narrative?: RecommendationNarrative;
  understanding: {
    flavors: string[];
    strength: string;
    ingredients: string[];
    occasion: string;
  };
  recommendation?: AgentRecommendationBundle;
  trustSignals: TrustSignal[];
  citations: Citation[];
  primaryRecommendation?: CocktailRecommendation;
  alternatives: CocktailRecommendation[];
  recipe?: {
    ingredients: Array<{ id: string; name: string; amount: string; optional: boolean }>;
    steps: string[];
    bartenderTip: string;
  };
  twist?: TwistSuggestion;
  shareCaption?: ShareCaption;
  visualSpec?: CocktailVisualSpec;
  followUpActions: AgentFollowUpAction[];
  sessionPatch?: Partial<AgentSessionState>;
  agentTrace?: AgentTraceEntry[];
  debug?: AgentDebugInfo;
  toolResults: BartenderAgentToolResults;
};
