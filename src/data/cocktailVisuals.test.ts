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

  it("keeps signature garnishes aligned with the current menu", () => {
    expect(cocktailVisuals["pisco-sour"].garnish).toContain("bitters_drops");
    expect(cocktailVisuals["penicillin"].garnish).toContain("ginger_slice");
    expect(cocktailVisuals["pornstar-martini"].garnish).toContain("passion_fruit");
    expect(cocktailVisuals["gin-basil-smash"].garnish).toContain("basil");
    expect(cocktailVisuals["bramble"].garnish).toContain("blackberry");
    expect(cocktailVisuals["naked-and-famous"].drinkColor).toBe("#E8C060");
    expect(cocktailVisuals["sazerac"].garnish).toContain("lemon_peel");
  });
});
