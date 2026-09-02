import { describe, expect, it } from "vitest";
import { cocktails } from "../data/cocktails";
import { buildBartenderOneLiner, buildUnderstandingSummary } from "./agentNarrative";
import type { ParsedPreference } from "./preferenceParser";

describe("agentNarrative", () => {
  const preference: ParsedPreference = {
    requestType: "ingredient_matching",
    availableIngredients: ["gin", "lemon-juice", "simple-syrup"],
    flavorPreferences: ["refreshing", "sour"],
    dislikedFlavors: [],
    strengthPreference: "low",
    difficulty: "easy",
    occasion: "summer"
  };

  it("summarizes what the bartender understood from the user request", () => {
    const summary = buildUnderstandingSummary(preference);

    expect(summary.flavors).toEqual(["清爽", "酸感"]);
    expect(summary.strength).toBe("轻一点");
    expect(summary.ingredients).toEqual(["金酒", "柠檬汁", "糖浆"]);
    expect(summary.occasion).toBe("夏天");
  });

  it("labels bubbly preference in Chinese", () => {
    const summary = buildUnderstandingSummary({
      ...preference,
      flavorPreferences: ["refreshing", "sour", "bubbly"]
    });

    expect(summary.flavors).toContain("气泡感");
  });

  it("builds a concise one-line bartender recommendation", () => {
    const cocktail = cocktails.find((item) => item.id === "gin-sour");
    if (!cocktail) throw new Error("missing fixture");

    const line = buildBartenderOneLiner({
      preference,
      cocktail,
      missingIngredients: []
    });

    expect(line).toContain("清爽");
    expect(line).toContain("金酒酸");
    expect(line).toContain("现在就可以开始");
  });

  it("does not treat every recipe ingredient as missing when the user gave no inventory", () => {
    const cocktail = cocktails.find((item) => item.id === "aviation");
    if (!cocktail) throw new Error("missing fixture");

    const line = buildBartenderOneLiner({
      preference: {
        ...preference,
        requestType: "classic_recommendation",
        availableIngredients: [],
        flavorPreferences: [],
        strengthPreference: "unknown",
        difficulty: "unknown",
        occasion: "unknown"
      },
      cocktail,
      missingIngredients: cocktail.ingredients.map((ingredient) => ingredient.ingredientId)
    });

    expect(line).toContain("如果还没想好");
    expect(line).toContain("飞行");
    expect(line).not.toContain("补齐");
    expect(line).not.toContain("需要补");
    expect(line).not.toContain("今晚的状态很明确");
  });

  it("mentions only genuinely missing items when the user provided ingredients", () => {
    const cocktail = cocktails.find((item) => item.id === "gin-sour");
    if (!cocktail) throw new Error("missing fixture");

    const line = buildBartenderOneLiner({
      preference: {
        ...preference,
        availableIngredients: ["gin"]
      },
      cocktail,
      missingIngredients: ["lemon-juice", "simple-syrup"]
    });

    expect(line).toBe("用你手边的材料，可以往 金酒酸 这个方向做；还差 柠檬汁、糖浆。");
  });
});
