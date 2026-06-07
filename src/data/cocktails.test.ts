import { describe, expect, it } from "vitest";
import { ingredientById } from "./ingredients";
import { cocktails } from "./cocktails";

const mojibakePattern = /[璋閰鈥�]/;

describe("cocktail data", () => {
  it("has 30 cocktails and bartender tips for every cocktail", () => {
    expect(cocktails).toHaveLength(54);

    for (const cocktail of cocktails) {
      expect(cocktail.bartenderTip).toBeTruthy();
    }
  });

  it("uses valid ingredient ids and readable Chinese copy", () => {
    for (const cocktail of cocktails) {
      const readableFields = [cocktail.name, cocktail.intro, cocktail.glass, cocktail.garnish, cocktail.bartenderTip, ...cocktail.tags, ...cocktail.steps];
      for (const value of readableFields) {
        expect(value).not.toMatch(mojibakePattern);
      }

      for (const ingredient of cocktail.ingredients) {
        expect(ingredientById.has(ingredient.ingredientId)).toBe(true);
      }
    }
  });
});
