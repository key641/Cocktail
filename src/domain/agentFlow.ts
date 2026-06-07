import { recommendByIngredients, recommendForExploration } from "./recommendation";
import type { Cocktail, CocktailRecommendation, Strength, TasteProfile } from "./types";
import type { ParsedFlavor, ParsedPreference } from "./preferenceParser";

type BuildAgentRecommendationInput = {
  cocktails: Cocktail[];
  preference: ParsedPreference;
  semanticQuery?: string;
  seed?: number;
};

type BuildAgentRecommendationResult = {
  recommendation: CocktailRecommendation;
  ownedIngredients: string[];
};

const defaultTasteProfile: TasteProfile = {
  sweet: 2,
  sour: 3,
  bitter: 1,
  fresh: 4,
  strong: 2,
  fruity: 2,
  herbal: 1,
  bubbly: 0
};

const flavorTasteBoosts: Record<ParsedFlavor, Partial<TasteProfile>> = {
  refreshing: { fresh: 5, sour: 3, strong: 1 },
  sour: { sour: 5, fresh: 4 },
  sweet: { sweet: 5, sour: 1 },
  bitter: { bitter: 5, herbal: 3, strong: 3 },
  fruity: { fruity: 5, sweet: 3, fresh: 3 },
  herbal: { herbal: 5, fresh: 3 },
  creamy: { sweet: 3, fresh: 0, strong: 2 },
  bubbly: { bubbly: 5, fresh: 5, strong: 1 }
};

export function strengthFromPreference(strengthPreference: ParsedPreference["strengthPreference"]): Strength {
  if (strengthPreference === "low") return "light";
  if (strengthPreference === "high") return "strong";
  return "medium";
}

export function tasteFromPreference(preference: ParsedPreference): TasteProfile {
  const taste = { ...defaultTasteProfile };
  for (const flavor of preference.flavorPreferences) {
    const boost = flavorTasteBoosts[flavor];
    for (const [key, value] of Object.entries(boost) as Array<[keyof TasteProfile, number]>) {
      taste[key] = Math.max(taste[key], value);
    }
  }

  for (const flavor of preference.dislikedFlavors) {
    if (flavor === "bitter") taste.bitter = 0;
    if (flavor === "sweet") taste.sweet = 0;
    if (flavor === "sour") taste.sour = 0;
    if (flavor === "herbal") taste.herbal = 0;
    if (flavor === "bubbly") taste.bubbly = 0;
  }

  return taste;
}

export function moodFromPreference(preference: ParsedPreference): "bright" | "quiet" | "bold" {
  if (preference.strengthPreference === "high" || preference.flavorPreferences.includes("bitter")) {
    return "bold";
  }
  if (preference.flavorPreferences.includes("fruity") || preference.flavorPreferences.includes("sour")) {
    return "bright";
  }
  return "quiet";
}

export function buildAgentRecommendation({
  cocktails,
  preference,
  semanticQuery,
  seed = Date.now()
}: BuildAgentRecommendationInput): BuildAgentRecommendationResult {
  const tasteProfile = tasteFromPreference(preference);

  if (preference.availableIngredients.length > 0 || preference.requestType === "ingredient_matching") {
    const [recommendation] = recommendByIngredients({
      cocktails,
      ownedIngredientIds: preference.availableIngredients,
      tasteProfile
    });

    return {
      recommendation,
      ownedIngredients: preference.availableIngredients
    };
  }

  return {
    recommendation: recommendForExploration({
      cocktails,
      mood: moodFromPreference(preference),
      preferredStrength: strengthFromPreference(preference.strengthPreference),
      tasteProfile,
      semanticQuery,
      seed
    }),
    ownedIngredients: []
  };
}
