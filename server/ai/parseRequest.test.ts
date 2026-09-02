import { describe, expect, it } from "vitest";
import { parseRequestForAgent } from "./parseRequest";
import type { GenerateJsonInput, OpenAIJsonClient } from "./openaiClient";

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

  it("short-circuits alcohol-risk requests before calling the model", async () => {
    let calls = 0;
    const client: OpenAIJsonClient = {
      generateText: async () => {
        throw new Error("not used");
      },
      generateJson: async <T>() => {
        calls += 1;
        return {} as T;
      },
      generateWebJson: async () => {
        throw new Error("not used");
      }
    };

    const result = await parseRequestForAgent({
      text: "我等下要开车，但想要像 Margarita 没那么冲，家里有青柠",
      client
    });

    expect(result.source).toBe("local");
    expect(result.preference.requestType).toBe("classic_twist");
    expect(result.preference.availableIngredients).toContain("lime-juice");
    expect(result.preference.referenceCocktail).toBe("margarita");
    expect(result.safety.shouldAvoidAlcohol).toBe(true);
    expect(result.safety.riskFlags).toContain("driving");
    expect(result.debug?.resolution).toBe("deterministic");
    expect(calls).toBe(0);
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

  it("recognizes capability questions as smalltalk locally", async () => {
    const result = await parseRequestForAgent({
      text: "你好，你能做什么？你的能力范围是什么？"
    });

    expect(result.source).toBe("local");
    expect(result.preference.requestType).toBe("smalltalk");
  });

  it("sends only locally retrieved candidates instead of the full cocktail catalog", async () => {
    let userPayload: unknown;
    const client: OpenAIJsonClient = {
      generateText: async () => "",
      generateJson: async <T>(input: GenerateJsonInput) => {
        userPayload = input.user;
        return {
          requestType: "recipe_lookup",
          action: "recipe",
          availableIngredients: [],
          flavorPreferences: [],
          dislikedFlavors: [],
          strengthPreference: "unknown",
          difficulty: "easy",
          occasion: "unknown",
          referenceCocktail: "mojito"
        } as T;
      },
      generateWebJson: async () => {
        throw new Error("not used");
      }
    };

    const result = await parseRequestForAgent({ text: "想来一杯适合慢慢聊天、不要太有攻击性的", client });
    const payload = userPayload as { candidateCocktails: unknown[]; knownCocktails?: unknown[] };

    expect(payload.candidateCocktails.length).toBeLessThanOrEqual(8);
    expect(payload.knownCocktails).toBeUndefined();
    expect(result.debug?.requestChars).toBeLessThan(2000);
  });

  it("ignores invalid model enum values and preserves complete local defaults", async () => {
    const client: OpenAIJsonClient = {
      generateText: async () => "",
      generateJson: async <T>() => ({
        requestType: "recommendation",
        action: "recommend",
        availableIngredients: [],
        flavorPreferences: ["fruity", "not-a-flavor"],
        dislikedFlavors: [],
        referenceCocktail: null
      }) as T,
      generateWebJson: async () => {
        throw new Error("not used");
      }
    };

    const result = await parseRequestForAgent({ text: "想来一杯不太有攻击性的", client });

    expect(result.preference.requestType).toBe("classic_recommendation");
    expect(result.preference.flavorPreferences).toEqual(["fruity"]);
    expect(result.preference.strengthPreference).toBe("unknown");
    expect(result.preference.difficulty).toBe("unknown");
    expect(result.preference.occasion).toBe("unknown");
  });

  it("resolves an exact recipe locally without calling the model", async () => {
    let calls = 0;
    const client: OpenAIJsonClient = {
      generateText: async () => "",
      generateJson: async <T>() => {
        calls += 1;
        return {} as T;
      },
      generateWebJson: async () => {
        throw new Error("not used");
      }
    };

    const result = await parseRequestForAgent({ text: "莫吉托怎么做？", client });

    expect(result.source).toBe("local");
    expect(result.preference.action).toBe("recipe");
    expect(result.preference.referenceCocktail).toBe("mojito");
    expect(result.debug?.resolution).toBe("deterministic");
    expect(calls).toBe(0);
  });
});
