export type IngredientCategory =
  | "spirit"
  | "liqueur"
  | "citrus"
  | "sweetener"
  | "juice"
  | "bitter"
  | "mixer"
  | "herb"
  | "garnish";

export type Strength = "light" | "medium" | "strong";

export type TasteKey = "sweet" | "sour" | "bitter" | "fresh" | "strong" | "fruity" | "herbal" | "bubbly";

export type TasteProfile = Record<TasteKey, number>;

export type GlassType =
  | "highball"
  | "collins"
  | "coupe"
  | "old_fashioned"
  | "martini"
  | "champagne_flute"
  | "wine"
  | "mule_mug"
  | "hurricane";

export type IceStyle = "none" | "cube" | "large_cube" | "crushed";
export type FoamLevel = "none" | "low" | "medium" | "high";
export type GarnishType =
  | "mint"
  | "basil"
  | "lime_wedge"
  | "lemon_wheel"
  | "lemon_peel"
  | "orange_peel"
  | "orange_slice"
  | "cherry"
  | "blackberry"
  | "passion_fruit"
  | "ginger_slice"
  | "chili"
  | "bitters_drops"
  | "olive"
  | "coffee_beans";
export type RimStyle = "none" | "salt" | "sugar";
export type BubbleLevel = "none" | "low" | "medium" | "high";

export type CocktailVisualSpec = {
  glassType: GlassType;
  drinkColor: string;
  drinkGradient?: {
    from: string;
    to: string;
    middle?: string;
    direction?: "vertical" | "horizontal";
  };
  opacity: number;
  hasIce: boolean;
  iceStyle: IceStyle;
  foamLevel: FoamLevel;
  garnish: GarnishType[];
  rimStyle: RimStyle;
  straw: boolean;
  bubbleLevel: BubbleLevel;
};

export type Ingredient = {
  id: string;
  name: string;
  category: IngredientCategory;
  aliases: string[];
  common: boolean;
  substitutes?: string[];
};

export type CocktailIngredient = {
  ingredientId: string;
  amount: string;
  optional?: boolean;
};

export type Cocktail = {
  id: string;
  name: string;
  englishName: string;
  intro: string;
  base: string;
  tags: string[];
  strength: Strength;
  glass: string;
  garnish: string;
  ingredients: CocktailIngredient[];
  steps: string[];
  tasteProfile: TasteProfile;
  bartenderTip: string;
  substitutions?: Record<string, string[]>;
};

export type ParsedIngredients = {
  ingredients: string[];
  unknown: string[];
};

export type RecommendationInput = {
  cocktails: Cocktail[];
  ownedIngredientIds: string[];
  tasteProfile: TasteProfile;
};

export type CocktailRecommendation = {
  cocktail: Cocktail;
  ownedIngredients: string[];
  missingIngredients: string[];
  score: number;
  reason: string;
};
