import { ingredients } from "../../src/data/ingredients";

export const parseRequestSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    requestType: {
      type: "string",
      enum: ["classic_recommendation", "classic_twist", "ingredient_matching", "substitution", "menu_share"]
    },
    availableIngredients: {
      type: "array",
      items: { type: "string", enum: ingredients.map((ingredient) => ingredient.id) }
    },
    flavorPreferences: {
      type: "array",
      items: { type: "string", enum: ["refreshing", "sour", "sweet", "bitter", "fruity", "herbal", "creamy", "bubbly"] }
    },
    dislikedFlavors: {
      type: "array",
      items: { type: "string", enum: ["refreshing", "sour", "sweet", "bitter", "fruity", "herbal", "creamy", "bubbly"] }
    },
    strengthPreference: { type: "string", enum: ["low", "medium", "high", "unknown"] },
    difficulty: { type: "string", enum: ["easy", "normal", "professional", "unknown"] },
    occasion: { type: "string", enum: ["summer", "date", "party", "aperitif", "after_dinner", "home", "unknown"] },
    referenceCocktail: {
      anyOf: [
        { type: "string" },
        { type: "null" }
      ]
    }
  },
  required: [
    "requestType",
    "availableIngredients",
    "flavorPreferences",
    "dislikedFlavors",
    "strengthPreference",
    "difficulty",
    "occasion",
    "referenceCocktail"
  ]
} as const;
