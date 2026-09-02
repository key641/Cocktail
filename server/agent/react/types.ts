import type { ParsedPreference } from "../../../src/domain/preferenceParser";
import type { CocktailRecommendation } from "../../../src/domain/types";
import type { TwistSuggestion } from "../../../src/domain/twistEngine";
import type { ShareCaption } from "../../../src/domain/captionGenerator";
import type { AgentFollowUpAction, ExternalInspirationSearchResult, ExternalRecipeSearchResult } from "../types";

export const REACT_TOOL_NAMES = [
  "search_cocktails",
  "match_cocktails",
  "get_cocktail_recipe",
  "suggest_classic_twist",
  "search_external_recipe",
  "search_inspiration",
  "generate_share_caption"
] as const;

export const REACT_TERMINAL_ACTIONS = [
  "final_recommendation",
  "ask_clarification",
  "smalltalk_reply"
] as const;

export type ReActToolName = (typeof REACT_TOOL_NAMES)[number];
export type ReActTerminalAction = (typeof REACT_TERMINAL_ACTIONS)[number];
export type ReActActionName = ReActToolName | ReActTerminalAction;

export type ReActStepDecision = {
  thought: string;
  action: ReActActionName;
  arguments: string;
};

export type ReActStepRecord = {
  thought: string;
  action: ReActActionName;
  arguments: string;
  observation: unknown;
};

export type ReActFinalArgs = {
  cocktailRef: string;
  reason: string;
  alternativeRefs: string[];
  intent: "classic_recommendation" | "ingredient_matching" | "named_cocktail_lookup" | "official_recipe_check" | "classic_twist" | "external_inspiration" | "share_caption";
  followUp?: AgentFollowUpAction[];
  forced?: boolean;
  hallucinatedRef?: string;
};

export type ReActClarificationArgs = {
  question: string;
  options: string[];
};

export type ReActSmalltalkArgs = {
  reply: string;
};

export type ReActOutcome =
  | { kind: "final_recommendation"; args: ReActFinalArgs }
  | { kind: "ask_clarification"; args: ReActClarificationArgs }
  | { kind: "smalltalk_reply"; args: ReActSmalltalkArgs };

export type ReActMatchSnapshot = {
  preference: ParsedPreference;
  primary: CocktailRecommendation;
  alternatives: CocktailRecommendation[];
  ownedIngredients: string[];
};

// 循环过程中沉淀的完整工具数据；observation 只回喂模型瘦身摘要，
// 最终组装响应时从这里取全量数据。
export type ReActStore = {
  lastMatch?: ReActMatchSnapshot;
  localCandidates: Map<string, CocktailRecommendation>;
  externalRecipes: Map<string, ExternalRecipeSearchResult>;
  inspiration?: ExternalInspirationSearchResult;
  twist?: { baseCocktailId: string; suggestion: TwistSuggestion };
  shareCaption?: ShareCaption;
};

export function createReActStore(): ReActStore {
  return {
    localCandidates: new Map(),
    externalRecipes: new Map()
  };
}

// 已被工具观察结果证实存在的推荐引用；final_recommendation 的反幻觉校验依赖它。
export function knownRefs(store: ReActStore): Set<string> {
  return new Set([...store.localCandidates.keys(), ...store.externalRecipes.keys()]);
}

export class ReActToolArgsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReActToolArgsError";
  }
}

export class ReActLoopError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReActLoopError";
  }
}
