import type {
  Cocktail,
  CocktailRecommendation,
  RecommendationInput,
  Strength,
  TasteKey,
  TasteProfile
} from "./types";
import { cocktailSemanticProfiles } from "../data/cocktailSemanticProfiles";

const tasteKeys: TasteKey[] = ["sweet", "sour", "bitter", "fresh", "strong", "fruity", "herbal", "bubbly"];

function requiredIngredients(cocktail: Cocktail) {
  return cocktail.ingredients.filter((ingredient) => !ingredient.optional).map((ingredient) => ingredient.ingredientId);
}

function tasteScore(cocktailTaste: TasteProfile, targetTaste: TasteProfile) {
  const maxDistance = tasteKeys.length * 5;
  const distance = tasteKeys.reduce((sum, key) => sum + Math.abs(cocktailTaste[key] - targetTaste[key]), 0);
  return 1 - distance / maxDistance;
}

function strengthScore(cocktailStrength: Strength, preferredStrength: Strength) {
  const order: Strength[] = ["light", "medium", "strong"];
  const distance = Math.abs(order.indexOf(cocktailStrength) - order.indexOf(preferredStrength));
  return 1 - distance / 2;
}

function semanticScore(cocktailId: string, semanticQuery?: string) {
  if (!semanticQuery?.trim()) return 0;
  const normalized = semanticQuery.toLowerCase();
  const profile = cocktailSemanticProfiles.find((item) => item.cocktailId === cocktailId);
  if (!profile) return 0;

  const hits = profile.semanticKeywords.filter((keyword) => normalized.includes(keyword.toLowerCase())).length;
  return Math.min(1, hits / 2);
}

function tasteWordsFor(tasteProfile: TasteProfile) {
  return [
    tasteProfile.fresh >= 4 ? "清爽" : "",
    tasteProfile.sour >= 4 ? "酸感" : "",
    tasteProfile.fruity >= 4 ? "果味" : "",
    tasteProfile.herbal >= 4 ? "草本" : "",
    tasteProfile.bitter >= 4 ? "苦甜" : ""
  ].filter(Boolean);
}

function reasonFor(recommendation: CocktailRecommendation, tasteProfile: TasteProfile) {
  const tasteWords = tasteWordsFor(tasteProfile);
  const direction = tasteWords.join("、") || "整体风味";

  if (recommendation.missingIngredients.length === 0) {
    return `你手上的材料已经能完整做出这杯，${direction}也贴合今晚的偏好。`;
  }

  return `已有 ${recommendation.ownedIngredients.length} 样核心材料，只需补 ${recommendation.missingIngredients.length} 样；${direction}方向匹配。`;
}

export function recommendByIngredients(input: RecommendationInput): CocktailRecommendation[] {
  const owned = new Set(input.ownedIngredientIds);

  return input.cocktails
    .map((cocktail) => {
      const required = requiredIngredients(cocktail);
      const ownedIngredients = required.filter((ingredientId) => owned.has(ingredientId));
      const missingIngredients = required.filter((ingredientId) => !owned.has(ingredientId));
      const coverage = required.length === 0 ? 0 : ownedIngredients.length / required.length;
      const taste = tasteScore(cocktail.tasteProfile, input.tasteProfile);
      const missingPenalty = missingIngredients.length / Math.max(required.length, 1);
      const score = coverage * 70 + taste * 20 - missingPenalty * 10;

      const recommendation: CocktailRecommendation = {
        cocktail,
        ownedIngredients,
        missingIngredients,
        score,
        reason: ""
      };

      recommendation.reason = reasonFor(recommendation, input.tasteProfile);
      return recommendation;
    })
    .sort((a, b) => b.score - a.score);
}

export function rankForExploration({
  cocktails,
  mood,
  preferredStrength,
  tasteProfile,
  semanticQuery,
  seed = Date.now()
}: {
  cocktails: Cocktail[];
  mood: "bright" | "quiet" | "bold";
  preferredStrength: Strength;
  tasteProfile: TasteProfile;
  semanticQuery?: string;
  seed?: number;
}): CocktailRecommendation[] {
  const moodBoost: Record<typeof mood, Partial<TasteProfile>> = {
    bright: { fresh: 1, fruity: 1 },
    quiet: { fresh: 1, herbal: 1, strong: -1 },
    bold: { strong: 1, bitter: 1 }
  };
  const adjustedTaste = { ...tasteProfile };
  for (const [key, value] of Object.entries(moodBoost[mood]) as [TasteKey, number][]) {
    adjustedTaste[key] = Math.max(0, Math.min(5, adjustedTaste[key] + value));
  }

  const ranked = cocktails
    .map((cocktail, index) => {
      const randomNudge = ((Math.sin(seed + index * 17) + 1) / 2) * 4;
      const semantic = semanticScore(cocktail.id, semanticQuery);
      const strengthPenalty = preferredStrength === "light" && cocktail.strength !== "light" ? 24 : 0;
      const bubblyPenalty = adjustedTaste.bubbly >= 4 && cocktail.tasteProfile.bubbly === 0 ? 36 : 0;
      const score = tasteScore(cocktail.tasteProfile, adjustedTaste) * 55 + strengthScore(cocktail.strength, preferredStrength) * 35 + semantic * 20 + randomNudge - strengthPenalty - bubblyPenalty;
      const direction = adjustedTaste.fresh >= 4 ? "清爽" : adjustedTaste.strong >= 4 ? "强烈" : "平衡";
      return {
        cocktail,
        ownedIngredients: [],
        missingIngredients: requiredIngredients(cocktail),
        score,
        reason: `这杯的${cocktail.tags.join("、")}气质适合现在的状态，尤其贴合你选择的${direction}方向。`
      };
    })
    .sort((a, b) => b.score - a.score);

  return ranked;
}

export function recommendForExploration(input: {
  cocktails: Cocktail[];
  mood: "bright" | "quiet" | "bold";
  preferredStrength: Strength;
  tasteProfile: TasteProfile;
  semanticQuery?: string;
  seed?: number;
}): CocktailRecommendation {
  return rankForExploration(input)[0];
}
