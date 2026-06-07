import { describe, expect, it } from "vitest";
import { parseUserPreference } from "./preferenceParser";

describe("parseUserPreference", () => {
  it("extracts flavor, strength, occasion and ingredient intent from Chinese input", () => {
    const result = parseUserPreference("我家里有金酒、柠檬和糖浆，想喝清爽一点、不太烈、适合夏天的");

    expect(result.requestType).toBe("ingredient_matching");
    expect(result.availableIngredients).toEqual(expect.arrayContaining(["gin", "lemon-juice", "simple-syrup"]));
    expect(result.flavorPreferences).toEqual(expect.arrayContaining(["refreshing"]));
    expect(result.strengthPreference).toBe("low");
    expect(result.occasion).toBe("summer");
  });

  it("recognizes classic twist requests without claiming they are official recipes", () => {
    const result = parseUserPreference("我想要像 Margarita 但没那么冲，更适合夏天");

    expect(result.requestType).toBe("classic_twist");
    expect(result.referenceCocktail).toBe("margarita");
    expect(result.strengthPreference).toBe("low");
    expect(result.occasion).toBe("summer");
  });
});
