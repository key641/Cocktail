import { describe, expect, it } from "vitest";
import { parseIngredientsLocally } from "./ingredientParser";

describe("parseIngredientsLocally", () => {
  it("maps common Chinese ingredient names to canonical ingredients", () => {
    const result = parseIngredientsLocally("我有金酒、柠檬、糖浆，还有薄荷");

    expect(result.ingredients).toEqual(["gin", "lemon-juice", "simple-syrup", "mint"]);
    expect(result.unknown).toEqual([]);
  });

  it("maps English aliases and keeps unknown free text visible", () => {
    const result = parseIngredientsLocally("tequila, lime, cointreau, mystery spice");

    expect(result.ingredients).toEqual(["tequila", "lime-juice", "orange-liqueur"]);
    expect(result.unknown).toContain("mystery spice");
  });
});
