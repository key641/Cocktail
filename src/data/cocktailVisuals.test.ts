import { describe, expect, it } from "vitest";
import { cocktails } from "./cocktails";
import { cocktailVisuals, getCocktailVisualSpec } from "./cocktailVisuals";

const hexColorPattern = /^#[0-9a-fA-F]{6}$/;

describe("cocktail visual mappings", () => {
  it("has one visual spec for every cocktail", () => {
    expect(Object.keys(cocktailVisuals)).toHaveLength(cocktails.length);

    for (const cocktail of cocktails) {
      const visualSpec = getCocktailVisualSpec(cocktail.id);
      expect(visualSpec).toBe(cocktailVisuals[cocktail.id]);
      expect(visualSpec.drinkColor).toMatch(hexColorPattern);

      if (visualSpec.drinkGradient) {
        expect(visualSpec.drinkGradient.from).toMatch(hexColorPattern);
        expect(visualSpec.drinkGradient.middle ?? visualSpec.drinkGradient.from).toMatch(hexColorPattern);
        expect(visualSpec.drinkGradient.to).toMatch(hexColorPattern);
      }
    }
  });
});
