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
  const requestedFlavorText = joinReadable(summary.flavors.slice(0, 2));
  const cocktailFlavorText = joinReadable(cocktail.tags.slice(0, 2));

  if (missingIngredients.length === 0 && summary.ingredients.length > 0) {
    const flavorDetail = requestedFlavorText ? `，也符合你想要的${requestedFlavorText}` : "";
    return `手边这些材料正好能做 ${cocktail.name}${flavorDetail}，现在就可以开始。`;
  }

  if (missingIngredients.length > 0 && summary.ingredients.length > 0) {
    return `用你手边的材料，可以往 ${cocktail.name} 这个方向做；还差 ${missingIngredients.map(getIngredientName).join("、")}。`;
  }

  if (requestedFlavorText) {
    return `想喝${requestedFlavorText}的话，可以先看看 ${cocktail.name}。它和你描述的方向比较接近。`;
  }

  const flavorDetail = cocktailFlavorText ? `，它偏${cocktailFlavorText}` : "";
  return `如果还没想好，可以先从 ${cocktail.name} 开始${flavorDetail}，看看是不是你喜欢的方向。`;
}
