import { getIngredientName } from "../data/ingredients";
import type { Cocktail } from "./types";
import type { ParsedFlavor, ParsedPreference } from "./preferenceParser";

export type UnderstandingSummary = {
  flavors: string[];
  strength: string;
  ingredients: string[];
  occasion: string;
};

const flavorLabels: Record<ParsedFlavor, string> = {
  refreshing: "清爽",
  sour: "酸感",
  sweet: "甜感",
  bitter: "苦甜",
  fruity: "果味",
  herbal: "草本",
  creamy: "绵密",
  bubbly: "气泡感"
};

const strengthLabels: Record<ParsedPreference["strengthPreference"], string> = {
  low: "轻一点",
  medium: "适中",
  high: "偏烈",
  unknown: "不确定"
};

const occasionLabels: Record<ParsedPreference["occasion"], string> = {
  summer: "夏天",
  date: "约会",
  party: "聚会",
  aperitif: "餐前",
  after_dinner: "餐后",
  home: "居家",
  unknown: "未指定"
};

function joinReadable(items: string[]) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join("、")}和${items[items.length - 1]}`;
}

export function buildUnderstandingSummary(preference: ParsedPreference): UnderstandingSummary {
  return {
    flavors: preference.flavorPreferences.map((flavor) => flavorLabels[flavor]),
    strength: strengthLabels[preference.strengthPreference],
    ingredients: preference.availableIngredients.map(getIngredientName),
    occasion: occasionLabels[preference.occasion]
  };
}

export function buildBartenderOneLiner({
  preference,
  cocktail,
  missingIngredients
}: {
  preference: ParsedPreference;
  cocktail: Cocktail;
  missingIngredients: string[];
}) {
  const summary = buildUnderstandingSummary(preference);
  const flavorText = summary.flavors[0] ?? cocktail.tags[0] ?? "刚好";
  const ingredientText = summary.ingredients.length ? `${joinReadable(summary.ingredients)}已经在手边` : "今晚的状态很明确";

  if (missingIngredients.length === 0 && summary.ingredients.length > 0) {
    return `你今晚要的是${flavorText}，${ingredientText}，所以这杯 ${cocktail.name} 今晚就能调。`;
  }

  if (missingIngredients.length > 0) {
    return `你想要${flavorText}，${ingredientText}；补齐 ${missingIngredients.map(getIngredientName).join("、")} 后，${cocktail.name} 会很合适。`;
  }

  return `你今晚要的是${flavorText}，不是复杂；这杯 ${cocktail.name} 刚好接住这个状态。`;
}
