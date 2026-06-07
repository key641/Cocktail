import { describe, expect, it } from "vitest";
import { cocktails } from "../data/cocktails";
import { recommendByIngredients, recommendForExploration } from "./recommendation";

describe("recommendByIngredients", () => {
  it("prioritizes cocktails with more owned ingredients and fewer missing purchases", () => {
    const [top] = recommendByIngredients({
      cocktails,
      ownedIngredientIds: ["gin", "lemon-juice", "simple-syrup"],
      tasteProfile: { sour: 4, fresh: 3, strong: 2, sweet: 2, bitter: 1, fruity: 1, herbal: 1, bubbly: 0 }
    });

    expect(top.cocktail.id).toBe("gin-sour");
    expect(top.ownedIngredients).toEqual(["gin", "lemon-juice", "simple-syrup"]);
    expect(top.missingIngredients).toEqual([]);
  });

  it("uses taste preferences to break close ingredient matches", () => {
    const [top] = recommendByIngredients({
      cocktails,
      ownedIngredientIds: ["gin", "lemon-juice"],
      tasteProfile: { sour: 5, fresh: 4, strong: 1, sweet: 1, bitter: 1, fruity: 1, herbal: 1, bubbly: 0 }
    });

    expect(top.cocktail.id).toBe("gin-sour");
  });
});

describe("recommendForExploration", () => {
  it("returns a cocktail matching strength and taste direction", () => {
    const result = recommendForExploration({
      cocktails,
      mood: "quiet",
      preferredStrength: "light",
      tasteProfile: { sour: 2, fresh: 5, strong: 1, sweet: 2, bitter: 1, fruity: 4, herbal: 3, bubbly: 0 },
      seed: 2
    });

    expect(result.cocktail.strength).toBe("light");
    expect(result.reason).toContain("清爽");
  });
});
