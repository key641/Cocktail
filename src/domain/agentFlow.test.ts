import { describe, expect, it } from "vitest";
import { cocktails } from "../data/cocktails";
import { buildAgentRecommendation } from "./agentFlow";
import type { ParsedPreference } from "./preferenceParser";

describe("buildAgentRecommendation", () => {
  it("uses parsed owned ingredients when the request is ingredient matching", () => {
    const preference: ParsedPreference = {
      requestType: "ingredient_matching",
      availableIngredients: ["gin", "lemon-juice", "simple-syrup"],
      flavorPreferences: ["refreshing", "sour"],
      dislikedFlavors: [],
      strengthPreference: "medium",
      difficulty: "easy",
      occasion: "home"
    };

    const result = buildAgentRecommendation({ cocktails, preference });

    expect(result.ownedIngredients).toEqual(["gin", "lemon-juice", "simple-syrup"]);
    expect(result.recommendation.cocktail.id).toBe("gin-sour");
  });

  it("uses exploration when no ingredients are provided", () => {
    const preference: ParsedPreference = {
      requestType: "classic_recommendation",
      availableIngredients: [],
      flavorPreferences: ["refreshing"],
      dislikedFlavors: [],
      strengthPreference: "low",
      difficulty: "easy",
      occasion: "summer"
    };

    const result = buildAgentRecommendation({ cocktails, preference, seed: 1 });

    expect(result.ownedIngredients).toEqual([]);
    expect(result.recommendation.reason).toContain("清爽");
  });

  it("uses bubbly preference and semantic query to avoid non-bubbly sour classics", () => {
    const preference: ParsedPreference = {
      requestType: "classic_recommendation",
      availableIngredients: [],
      flavorPreferences: ["refreshing", "sour", "bubbly"],
      dislikedFlavors: [],
      strengthPreference: "unknown",
      difficulty: "easy",
      occasion: "summer"
    };

    const result = buildAgentRecommendation({
      cocktails,
      preference,
      semanticQuery: "??????????????????????",
      seed: 1
    });

    expect(result.recommendation.cocktail.id).not.toBe("margarita");
    expect(result.recommendation.cocktail.tasteProfile.bubbly).toBeGreaterThan(0);
  });

});
