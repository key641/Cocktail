import { cocktails } from "../data/cocktails";
import { parseIngredientsLocally } from "./ingredientParser";

export type ParsedRequestType =
  | "classic_recommendation"
  | "recipe_lookup"
  | "classic_twist"
  | "ingredient_matching"
  | "substitution"
  | "menu_share"
  | "smalltalk";

export type ParsedAction = "recommend" | "recipe" | "twist" | "substitute" | "share" | "smalltalk";

export type ParsedFlavor = "refreshing" | "sour" | "sweet" | "bitter" | "fruity" | "herbal" | "creamy" | "bubbly";

export type ParsedPreference = {
  requestType: ParsedRequestType;
  action?: ParsedAction;
  availableIngredients: string[];
  flavorPreferences: ParsedFlavor[];
  dislikedFlavors: ParsedFlavor[];
  strengthPreference: "low" | "medium" | "high" | "unknown";
  difficulty: "easy" | "normal" | "professional" | "unknown";
  occasion: "summer" | "date" | "party" | "aperitif" | "after_dinner" | "home" | "unknown";
  referenceCocktail?: string;
};

const flavorMatchers: Array<[ParsedFlavor, RegExp]> = [
  ["refreshing", /清爽|轻盈|夏天|解腻|气泡|凉快/],
  ["sour", /酸|酸甜|柠檬|青柠/],
  ["sweet", /甜|甜一点|不苦/],
  ["bitter", /苦甜|苦|尼格罗尼|金巴利/],
  ["fruity", /果味|水果|橙|葡萄柚|莓|菠萝/],
  ["herbal", /草本|薄荷|香草|迷迭香|罗勒/],
  ["creamy", /奶|椰|顺滑|绵密/]
];

flavorMatchers.push(["bubbly", /气泡|氣泡|泡泡|冒泡|起泡|苏打|蘇打|汽水|sparkling|bubbly|fizz|soda/i]);

const dislikedFlavorMatchers: Array<[ParsedFlavor, RegExp]> = [
  ["bitter", /不要苦|不喜欢苦|苦味低|别太苦/],
  ["sweet", /不要甜|不喜欢甜|别太甜/],
  ["sour", /不要酸|不喜欢酸|别太酸/],
  ["herbal", /不要薄荷|不喜欢薄荷|不要草本/]
];

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function parseStrength(input: string): ParsedPreference["strengthPreference"] {
  if (/不太烈|没那么冲|酒精感低|低度|轻一点|适合新手/.test(input)) return "low";
  if (/烈一点|强烈|酒精感强|高度|够劲/.test(input)) return "high";
  if (/中等|刚刚好|适中/.test(input)) return "medium";
  return "unknown";
}

function parseDifficulty(input: string): ParsedPreference["difficulty"] {
  if (/简单|新手|容易|家里/.test(input)) return "easy";
  if (/专业|进阶|复杂|仪式感/.test(input)) return "professional";
  if (/普通|正常/.test(input)) return "normal";
  return "unknown";
}

function parseOccasion(input: string): ParsedPreference["occasion"] {
  if (/夏天|夏日|夏夜|热天/.test(input)) return "summer";
  if (/约会|两个人/.test(input)) return "date";
  if (/聚会|派对|朋友/.test(input)) return "party";
  if (/餐前|开胃/.test(input)) return "aperitif";
  if (/餐后|饭后|睡前/.test(input)) return "after_dinner";
  if (/在家|家里|居家/.test(input)) return "home";
  return "unknown";
}

export function findReferenceCocktail(input: string) {
  const normalized = input.toLowerCase();
  return cocktails.find((cocktail) => {
    return (
      normalized.includes(cocktail.id) ||
      normalized.includes(cocktail.englishName.toLowerCase()) ||
      normalized.includes(cocktail.name.toLowerCase())
    );
  })?.id;
}

function isDirectLocalCocktailQuery(input: string, referenceCocktail?: string) {
  if (!referenceCocktail) return false;
  const cocktail = cocktails.find((item) => item.id === referenceCocktail);
  if (!cocktail) return false;
  const normalized = input
    .toLowerCase()
    .replace(/请|麻烦|帮我|给我|搜一下|搜索|搜|查一下|查找|查|找一下|看看|介绍一下|介绍|详情|鸡尾酒|cocktail|recipe|配方|怎么做|如何做|做法|是什么|是啥/gi, "")
    .replace(/[\s，。！？、,.!?：:；;“”"'‘’()（）\-_&]/g, "");
  return [cocktail.id, cocktail.name, cocktail.englishName]
    .map((name) => name.toLowerCase().replace(/[\s\-_&]/g, ""))
    .includes(normalized);
}

export function parseRequestAction(
  input: string,
  availableIngredients: string[],
  referenceCocktail?: string
): ParsedAction {
  if (/你是谁|你能做什么|能干什么|有什么能力|能力范围|怎么用|使用说明|帮助|\bhelp\b|\bhello\b|\bhi\b|你好|闲聊|聊天/i.test(input)) return "smalltalk";
  if (/分享|文案|发朋友圈|小红书|卡片/.test(input)) return "share";
  if (/怎么做|如何做|做法|配方|制作步骤|材料.{0,6}步骤|步骤.{0,6}材料|\brecipe\b|how to make/i.test(input) && referenceCocktail) return "recipe";
  if (isDirectLocalCocktailQuery(input, referenceCocktail)) return "recipe";
  if (/替代|没有.*怎么办|能不能换/.test(input)) return "substitute";
  if (/像|类似|但|改|没那么|twist/i.test(input) && referenceCocktail) return "twist";
  if (/我有|家里有|手边有|现有|库存/.test(input) || availableIngredients.length > 0) return "recommend";
  return "recommend";
}

function requestTypeFromAction(action: ParsedAction, availableIngredients: string[]): ParsedRequestType {
  if (action === "smalltalk") return "smalltalk";
  if (action === "share") return "menu_share";
  if (action === "recipe") return "recipe_lookup";
  if (action === "substitute") return "substitution";
  if (action === "twist") return "classic_twist";
  if (availableIngredients.length > 0) return "ingredient_matching";
  return "classic_recommendation";
}

export function parseUserPreference(input: string): ParsedPreference {
  const parsedIngredients = parseIngredientsLocally(input);
  const referenceCocktail = findReferenceCocktail(input);
  const flavorPreferences = unique(flavorMatchers.filter(([, matcher]) => matcher.test(input)).map(([flavor]) => flavor));
  const dislikedFlavors = unique(dislikedFlavorMatchers.filter(([, matcher]) => matcher.test(input)).map(([flavor]) => flavor));
  const action = parseRequestAction(input, parsedIngredients.ingredients, referenceCocktail);

  return {
    requestType: requestTypeFromAction(action, parsedIngredients.ingredients),
    action,
    availableIngredients: parsedIngredients.ingredients,
    flavorPreferences,
    dislikedFlavors,
    strengthPreference: parseStrength(input),
    difficulty: parseDifficulty(input),
    occasion: parseOccasion(input),
    referenceCocktail
  };
}
