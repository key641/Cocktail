import { describe, expect, it } from "vitest";
import { cocktails } from "./cocktails";
import { ingredientById } from "./ingredients";

const mojibakePattern = /[鐠嬮柊閳璋閰鈥�]/;
const nonIbaPopularCocktails = new Set([
  "Gin Sour",
  "Gin & Tonic",
  "Gold Rush",
  "Ranch Water",
  "Hugo Spritz",
  "Spicy Margarita",
  "Kentucky Mule",
  "Limoncello Spritz",
  "Dirty Shirley",
  "Mezcal Mule",
  "Amaretto Sour"
]);

function getCocktail(englishName: string) {
  const cocktail = cocktails.find((entry) => entry.englishName === englishName);
  expect(cocktail, `${englishName} should exist`).toBeTruthy();
  return cocktail!;
}

function getIngredientIds(englishName: string) {
  return getCocktail(englishName).ingredients.map((ingredient) => ingredient.ingredientId);
}

describe("cocktail data", () => {
  it("has 54 cocktails and bartender tips for every cocktail", () => {
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

  it("keeps IBA signature ingredients accurate", () => {
    expect(getIngredientIds("Tequila Sunrise")).toContain("grenadine");
    expect(getIngredientIds("Tequila Sunrise")).not.toContain("simple-syrup");

    expect(getIngredientIds("Pisco Sour")).toEqual(expect.arrayContaining(["pisco", "egg-white", "angostura-bitters"]));

    expect(getIngredientIds("Penicillin")).toEqual(expect.arrayContaining(["scotch", "ginger-root", "honey-syrup", "lemon-juice"]));
    expect(getIngredientIds("Penicillin")).not.toContain("ginger-beer");

    expect(getIngredientIds("Pornstar Martini")).toEqual(
      expect.arrayContaining(["vanilla-vodka", "passion-fruit-liqueur", "passion-fruit-puree", "sparkling-wine"])
    );

    expect(getIngredientIds("Naked and Famous")).toContain("yellow-chartreuse");
    expect(getIngredientIds("Naked and Famous")).not.toContain("green-chartreuse");
  });

  it("tracks popular non-IBA drinks separately in test coverage", () => {
    const currentNames = new Set(cocktails.map((cocktail) => cocktail.englishName));

    for (const englishName of nonIbaPopularCocktails) {
      expect(currentNames.has(englishName), `${englishName} should remain an intentional popular entry`).toBe(true);
    }
  });
});
