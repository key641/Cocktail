import { describe, expect, it } from "vitest";
import { parseRequestForAgent } from "./parseRequest";
import type { OpenAIJsonClient } from "./openaiClient";

describe("parseRequestForAgent", () => {
  it("falls back to local parsing when no AI client is provided", async () => {
    const result = await parseRequestForAgent({
      text: "我家里有金酒、柠檬和糖浆，想喝清爽一点、不太烈、适合夏天的"
    });

    expect(result.source).toBe("local");
    expect(result.preference.requestType).toBe("ingredient_matching");
    expect(result.preference.availableIngredients).toEqual(expect.arrayContaining(["gin", "lemon-juice", "simple-syrup"]));
    expect(result.preference.flavorPreferences).toEqual(expect.arrayContaining(["refreshing"]));
  });

  it("merges AI understanding with local ingredients and safety flags", async () => {
    const client: OpenAIJsonClient = {
      generateText: async () => {
        throw new Error("not used");
      },
      generateJson: async <T>() => ({
        requestType: "classic_twist",
        availableIngredients: ["tequila"],
        flavorPreferences: ["fruity"],
        dislikedFlavors: [],
        strengthPreference: "low",
        difficulty: "easy",
        occasion: "summer",
        referenceCocktail: "margarita"
      }) as T,
      generateWebJson: async () => {
        throw new Error("not used");
      }
    };

    const result = await parseRequestForAgent({
      text: "我等下要开车，但想要像 Margarita 没那么冲，家里有青柠",
      client
    });

    expect(result.source).toBe("ai");
    expect(result.preference.requestType).toBe("classic_twist");
    expect(result.preference.availableIngredients).toEqual(expect.arrayContaining(["tequila", "lime-juice"]));
    expect(result.preference.referenceCocktail).toBe("margarita");
    expect(result.safety.shouldAvoidAlcohol).toBe(true);
    expect(result.safety.riskFlags).toContain("driving");
  });

  it("falls back locally when AI generation fails", async () => {
    const client: OpenAIJsonClient = {
      generateText: async () => {
        throw new Error("not used");
      },
      generateJson: async () => {
        throw new Error("network");
      },
      generateWebJson: async () => {
        throw new Error("not used");
      }
    };

    const result = await parseRequestForAgent({
      text: "我有金酒和柠檬，想喝酸一点",
      client
    });

    expect(result.source).toBe("local");
    expect(result.preference.availableIngredients).toEqual(expect.arrayContaining(["gin", "lemon-juice"]));
  });
});
