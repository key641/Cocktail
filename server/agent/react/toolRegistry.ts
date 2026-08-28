import type { OpenAIJsonClient } from "../../ai/openaiClient";
import type { ParsedFlavor, ParsedPreference } from "../../../src/domain/preferenceParser";
import type { CaptionStyle } from "../../../src/domain/captionGenerator";
import { cocktails } from "../../../src/data/cocktails";
import { ingredients } from "../../../src/data/ingredients";
import {
  generateShareCaptionTool,
  getCocktailRecipeTool,
  matchCocktailsTool,
  searchCocktailInspirationTool,
  searchCocktailRecipeTool,
  suggestClassicTwistTool
} from "../tools";
import type { AgentSessionState } from "../types";
import { ReActToolArgsError, type ReActStore, type ReActToolName } from "./types";

export type ReActRunContext = {
  client?: OpenAIJsonClient;
  session?: AgentSessionState;
  store: ReActStore;
};

export type ReActTool = {
  name: ReActToolName;
  description: string;
  argsDoc: string;
  run(args: Record<string, unknown>, ctx: ReActRunContext): Promise<unknown>;
};

const FLAVOR_VALUES: ParsedFlavor[] = ["refreshing", "sour", "sweet", "bitter", "fruity", "herbal", "creamy", "bubbly"];

const FLAVOR_ALIASES: Record<string, ParsedFlavor> = {
  清爽: "refreshing",
  酸: "sour",
  甜: "sweet",
  苦: "bitter",
  果味: "fruity",
  水果: "fruity",
  草本: "herbal",
  奶香: "creamy",
  绵密: "creamy",
  气泡: "bubbly"
};

const STRENGTH_VALUES = ["low", "medium", "high"] as const;
const OCCASION_VALUES = ["summer", "date", "party", "aperitif", "after_dinner", "home"] as const;
const CAPTION_STYLES: CaptionStyle[] = ["casual_share", "achievement", "professional_note", "lyric_mood"];

const cocktailIds = new Set(cocktails.map((cocktail) => cocktail.id));

const ingredientIdByToken = new Map<string, string>();
for (const ingredient of ingredients) {
  ingredientIdByToken.set(ingredient.id.toLowerCase(), ingredient.id);
  ingredientIdByToken.set(ingredient.name.toLowerCase(), ingredient.id);
  for (const alias of ingredient.aliases ?? []) {
    ingredientIdByToken.set(alias.trim().toLowerCase(), ingredient.id);
  }
}

export function externalRef(cocktailName: string): string {
  return `external-${cocktailName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cocktail"}`;
}

function asOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new ReActToolArgsError(`参数 ${field} 必须是字符串`);
  }
  return value;
}

function asRequiredString(value: unknown, field: string): string {
  const parsed = asOptionalString(value, field);
  if (!parsed) {
    throw new ReActToolArgsError(`缺少必填参数 ${field}`);
  }
  return parsed;
}

function asStringArray(value: unknown, field: string): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new ReActToolArgsError(`参数 ${field} 必须是字符串数组`);
  }
  return value as string[];
}

function normalizeFlavors(values: string[]): { flavors: ParsedFlavor[]; dropped: string[] } {
  const flavors: ParsedFlavor[] = [];
  const dropped: string[] = [];
  for (const raw of values) {
    const token = raw.trim();
    const flavor = FLAVOR_VALUES.includes(token as ParsedFlavor)
      ? (token as ParsedFlavor)
      : FLAVOR_ALIASES[token];
    if (flavor && !flavors.includes(flavor)) {
      flavors.push(flavor);
    } else if (!flavor) {
      dropped.push(raw);
    }
  }
  return { flavors, dropped };
}

function normalizeIngredients(values: string[]): { ids: string[]; dropped: string[] } {
  const ids: string[] = [];
  const dropped: string[] = [];
  for (const raw of values) {
    const resolved = ingredientIdByToken.get(raw.trim().toLowerCase());
    if (resolved && !ids.includes(resolved)) {
      ids.push(resolved);
    } else if (!resolved) {
      dropped.push(raw);
    }
  }
  return { ids, dropped };
}

function normalizeStrength(value: unknown): ParsedPreference["strengthPreference"] {
  if (value === undefined || value === null || value === "" || value === "unknown") return "unknown";
  if (typeof value === "string" && STRENGTH_VALUES.includes(value as (typeof STRENGTH_VALUES)[number])) {
    return value as ParsedPreference["strengthPreference"];
  }
  throw new ReActToolArgsError(`参数 strength 只能是 ${STRENGTH_VALUES.join("/")}`);
}

function normalizeOccasion(value: unknown): ParsedPreference["occasion"] {
  if (value === undefined || value === null || value === "" || value === "unknown") return "unknown";
  if (typeof value === "string" && OCCASION_VALUES.includes(value as (typeof OCCASION_VALUES)[number])) {
    return value as ParsedPreference["occasion"];
  }
  throw new ReActToolArgsError(`参数 occasion 只能是 ${OCCASION_VALUES.join("/")}`);
}

function requireCocktailId(value: unknown): string {
  const id = asRequiredString(value, "cocktail_id");
  if (!cocktailIds.has(id)) {
    throw new ReActToolArgsError(`酒款 id "${id}" 不在本地酒库中，请使用 match_cocktails 观察结果里的 id`);
  }
  return id;
}

const matchCocktails: ReActTool = {
  name: "match_cocktails",
  description: "按口味/强度/场景/可用材料在本地 50 款经典酒库中匹配，返回主推荐与备选（含匹配得分与缺料）。这是推荐的首选工具。",
  argsDoc: `{"flavors": ["refreshing|sour|sweet|bitter|fruity|herbal|creamy|bubbly"], "disliked_flavors": [同上], "strength": "low|medium|high", "occasion": "summer|date|party|aperitif|after_dinner|home", "available_ingredient_ids": ["gin", "lime-juice", ...], "semantic_query": "用户原话或语义描述"}（所有字段可选）`,
  async run(args, ctx) {
    const { flavors, dropped: droppedFlavors } = normalizeFlavors(asStringArray(args.flavors, "flavors"));
    const { flavors: disliked, dropped: droppedDisliked } = normalizeFlavors(asStringArray(args.disliked_flavors, "disliked_flavors"));
    const { ids: availableIngredients, dropped: droppedIngredients } = normalizeIngredients(
      asStringArray(args.available_ingredient_ids, "available_ingredient_ids")
    );
    const semanticQuery = asOptionalString(args.semantic_query, "semantic_query");

    const preference: ParsedPreference = {
      requestType: availableIngredients.length > 0 ? "ingredient_matching" : "classic_recommendation",
      availableIngredients,
      flavorPreferences: flavors,
      dislikedFlavors: disliked,
      strengthPreference: normalizeStrength(args.strength),
      difficulty: "unknown",
      occasion: normalizeOccasion(args.occasion)
    };

    const matched = matchCocktailsTool(preference, semanticQuery);
    // 确定性守护：会话里明确拒绝过的酒不再作为主推荐
    const rejected = new Set(ctx.session?.rejectedRecommendationIds ?? []);
    let { primaryRecommendation } = matched;
    let alternatives = matched.alternatives;
    let rejectionNote: string | undefined;
    if (rejected.has(primaryRecommendation.cocktail.id)) {
      const replacement = alternatives.find((candidate) => !rejected.has(candidate.cocktail.id));
      if (replacement) {
        alternatives = [primaryRecommendation, ...alternatives.filter((item) => item !== replacement)];
        primaryRecommendation = replacement;
        rejectionNote = "原首选被用户拒绝过，已自动换为备选";
      } else {
        rejectionNote = "用户拒绝过该酒款，但暂无更好替代";
      }
    }
    if (!rejectionNote && rejected.size > 0) {
      rejectionNote = "已避开用户拒绝过的酒款";
    }

    ctx.store.lastMatch = {
      preference,
      primary: primaryRecommendation,
      alternatives,
      ownedIngredients: matched.ownedIngredients
    };
    ctx.store.localCandidates.set(primaryRecommendation.cocktail.id, primaryRecommendation);
    for (const alternative of alternatives) {
      ctx.store.localCandidates.set(alternative.cocktail.id, alternative);
    }

    const droppedNotes = [
      droppedFlavors.length ? `忽略未知口味：${droppedFlavors.join("、")}` : "",
      droppedDisliked.length ? `忽略未知口味：${droppedDisliked.join("、")}` : "",
      droppedIngredients.length ? `忽略未识别材料：${droppedIngredients.join("、")}` : "",
      rejectionNote ?? ""
    ].filter(Boolean);

    return {
      primary: {
        ref: primaryRecommendation.cocktail.id,
        name: primaryRecommendation.cocktail.name,
        english_name: primaryRecommendation.cocktail.englishName,
        score: primaryRecommendation.score,
        tags: primaryRecommendation.cocktail.tags,
        strength: primaryRecommendation.cocktail.strength,
        missing_ingredients: primaryRecommendation.missingIngredients
      },
      alternatives: alternatives.map((candidate) => ({
        ref: candidate.cocktail.id,
        name: candidate.cocktail.name,
        score: candidate.score,
        tags: candidate.cocktail.tags
      })),
      owned_ingredients_count: matched.ownedIngredients.length,
      note: droppedNotes.join("；") || undefined
    };
  }
};

const getRecipe: ReActTool = {
  name: "get_cocktail_recipe",
  description: "查看某款本地酒的完整配方（材料、步骤、酒保提示）。",
  argsDoc: `{"cocktail_id": "本地酒款 id，来自 match_cocktails 观察结果"}`,
  async run(args) {
    const cocktailId = requireCocktailId(args.cocktail_id);
    const recipe = getCocktailRecipeTool(cocktailId);
    if (!recipe) {
      throw new ReActToolArgsError(`未找到酒款 ${cocktailId} 的配方`);
    }
    return {
      ref: cocktailId,
      name: recipe.cocktail.name,
      ingredients: recipe.ingredients.map((item) => ({ name: item.name, amount: item.amount, optional: item.optional })),
      steps: recipe.steps,
      bartender_tip: recipe.bartenderTip
    };
  }
};

const suggestTwist: ReActTool = {
  name: "suggest_classic_twist",
  description: "基于一款本地经典酒生成改编版本（更轻/更甜/换风味方向等）。",
  argsDoc: `{"cocktail_id": "基底酒款 id", "flavors": [...], "disliked_flavors": [...], "strength": "low|medium|high", "occasion": "..."}（除 cocktail_id 外可选）`,
  async run(args, ctx) {
    const cocktailId = requireCocktailId(args.cocktail_id);
    const { flavors } = normalizeFlavors(asStringArray(args.flavors, "flavors"));
    const { flavors: disliked } = normalizeFlavors(asStringArray(args.disliked_flavors, "disliked_flavors"));
    const suggestion = suggestClassicTwistTool(cocktailId, {
      flavorPreferences: flavors,
      dislikedFlavors: disliked,
      strengthPreference: normalizeStrength(args.strength),
      occasion: normalizeOccasion(args.occasion)
    });
    if (!suggestion) {
      throw new ReActToolArgsError(`无法基于 ${cocktailId} 生成改编`);
    }
    ctx.store.twist = { baseCocktailId: cocktailId, suggestion };
    return {
      base_ref: cocktailId,
      twist_title: suggestion.title,
      description: suggestion.description,
      adjustments: suggestion.adjustments
    };
  }
};

const searchExternalRecipe: ReActTool = {
  name: "search_external_recipe",
  description: "在外部权威来源搜索指定酒款的配方（本地酒库没有这款酒、或用户要求核对官方配方时使用）。",
  argsDoc: `{"query": "酒名 + cocktail recipe，英文效果更好", "official_only": true 表示只认 IBA 官方来源}`,
  async run(args, ctx) {
    const query = asRequiredString(args.query, "query");
    const officialOnly = args.official_only === true;
    const result = await searchCocktailRecipeTool({ query, officialOnly, client: ctx.client });
    if (result.status !== "found") {
      return { status: result.status, note: result.notes || "外部搜索不可用或未找到可靠配方" };
    }
    const ref = externalRef(result.cocktailName);
    ctx.store.externalRecipes.set(ref, result);
    return {
      status: result.status,
      ref,
      cocktail_name: result.cocktailName,
      source_type: result.sourceType,
      confidence: result.confidence,
      ingredients_count: result.ingredients.length,
      citations_count: result.citations.length,
      note: result.notes || undefined
    };
  }
};

const searchInspiration: ReActTool = {
  name: "search_inspiration",
  description: "本地匹配得分低、用户需求特殊时，在外部搜索符合描述的经典/现代经典方向。",
  argsDoc: `{"query": "用户的口味/场景描述"}`,
  async run(args, ctx) {
    const query = asRequiredString(args.query, "query");
    const result = await searchCocktailInspirationTool({ query, client: ctx.client });
    ctx.store.inspiration = result;
    if (result.status !== "found" || result.candidates.length === 0) {
      return { status: result.status, note: result.notes || "外部灵感搜索不可用或无结果" };
    }
    const candidates = result.candidates.map((candidate) => {
      const ref = externalRef(candidate.cocktailName);
      ctx.store.externalRecipes.set(ref, {
        status: "found",
        ...candidate,
        sourceUrl: result.citations[0]?.url,
        citations: result.citations
      });
      return {
        ref,
        cocktail_name: candidate.cocktailName,
        source_type: candidate.sourceType,
        confidence: candidate.confidence
      };
    });
    return { status: result.status, candidates, note: result.notes || undefined };
  }
};

const shareCaption: ReActTool = {
  name: "generate_share_caption",
  description: "为一款本地酒生成分享文案（用户想发朋友圈/分享时使用）。",
  argsDoc: `{"cocktail_id": "本地酒款 id", "style": "casual_share|achievement|professional_note|lyric_mood"}（style 可选，默认 casual_share）`,
  async run(args, ctx) {
    const cocktailId = requireCocktailId(args.cocktail_id);
    const styleRaw = asOptionalString(args.style, "style") ?? "casual_share";
    if (!CAPTION_STYLES.includes(styleRaw as CaptionStyle)) {
      throw new ReActToolArgsError(`参数 style 只能是 ${CAPTION_STYLES.join("/")}`);
    }
    const caption = generateShareCaptionTool(cocktailId, styleRaw as CaptionStyle);
    if (!caption) {
      throw new ReActToolArgsError(`无法为 ${cocktailId} 生成分享文案`);
    }
    ctx.store.shareCaption = caption;
    return { ref: cocktailId, caption };
  }
};

export const reactToolRegistry: Record<ReActToolName, ReActTool> = {
  match_cocktails: matchCocktails,
  get_cocktail_recipe: getRecipe,
  suggest_classic_twist: suggestTwist,
  search_external_recipe: searchExternalRecipe,
  search_inspiration: searchInspiration,
  generate_share_caption: shareCaption
};
