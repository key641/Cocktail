import { describe, expect, it } from "vitest";
import {
  generateShareCaptionTool,
  getCocktailRecipeTool,
  getVisualSpecTool,
  matchCocktailsTool,
  safetyCheckTool,
  searchCocktailRecipeTool,
  suggestClassicTwistTool
} from "./tools";
import type { GenerateWebJsonResult, OpenAIJsonClient } from "../ai/openaiClient";
import type { ParsedPreference } from "../../src/domain/preferenceParser";

describe("agent tools", () => {
  it("checks safety contexts before recommendation", () => {
    const safety = safetyCheckTool("我等下要开车，还在吃药");

    expect(safety.shouldAvoidAlcohol).toBe(true);
    expect(safety.riskFlags).toEqual(expect.arrayContaining(["driving", "medication"]));
  });

  it("returns a complete cocktail recipe by id", () => {
    const recipe = getCocktailRecipeTool("mojito");

    expect(recipe?.cocktail.name).toBe("莫吉托");
    expect(recipe?.ingredients.map((ingredient) => ingredient.name)).toEqual(expect.arrayContaining(["白朗姆", "青柠汁"]));
    expect(recipe?.steps.length).toBeGreaterThan(0);
  });

  it("suggests a classic-structure twist without claiming it is official", () => {
    const twist = suggestClassicTwistTool("negroni", {
      flavorPreferences: ["refreshing"],
      dislikedFlavors: ["bitter"],
      strengthPreference: "low",
      occasion: "summer"
    });

    expect(twist?.title).toContain("清爽");
    expect(twist?.disclaimer).toContain("不是 IBA 官方配方");
  });

  it("generates a share caption and visual spec for a cocktail", () => {
    const caption = generateShareCaptionTool("mojito", "lyric_mood");
    const visual = getVisualSpecTool("mojito");

    expect(caption?.copyrightSafe).toBe(true);
    expect(caption?.captionFull).toContain("自己调出来");
    expect(visual?.glassType).toBe("collins");
  });

  it("keeps alternatives aligned with bubbly semantic exploration", () => {
    const preference: ParsedPreference = {
      requestType: "classic_recommendation",
      availableIngredients: [],
      flavorPreferences: ["refreshing", "sour", "bubbly"],
      dislikedFlavors: [],
      strengthPreference: "unknown",
      difficulty: "easy",
      occasion: "summer"
    };

    const result = matchCocktailsTool(preference, "refreshing sour sparkling summer highball");
    const allCandidates = [result.primaryRecommendation, ...result.alternatives];

    expect(result.primaryRecommendation.cocktail.id).not.toBe("margarita");
    expect(allCandidates.every((candidate) => candidate.cocktail.tasteProfile.bubbly > 0)).toBe(true);
  });

  it("returns unavailable when external web search has no OpenAI client", async () => {
    const result = await searchCocktailRecipeTool({ query: "Paper Plane recipe" });

    expect(result.status).toBe("unavailable");
    expect(result.notes).toContain("OPENAI_API_KEY");
  });

  it("searches external cocktail recipes with citations when a web client is available", async () => {
    const client: OpenAIJsonClient = {
      generateText: async () => {
        throw new Error("not used");
      },
      generateJson: async () => {
        throw new Error("not used");
      },
      generateWebJson: async <T>(): Promise<GenerateWebJsonResult<T>> => ({
        data: {
          sourceType: "iba_official",
          cocktailName: "Mojito",
          ingredients: [{ name: "White rum", amount: "45 ml" }],
          steps: ["Build in glass"],
          glass: "Highball",
          garnish: "Mint",
          confidence: 0.92,
          notes: "Found from official source"
        } as T,
        citations: [{ url: "https://iba-world.com/mojito/", title: "Mojito" }]
      })
    };

    const result = await searchCocktailRecipeTool({
      query: "Mojito IBA official recipe",
      officialOnly: true,
      client
    });

    expect(result.status).toBe("found");
    expect(result.sourceType).toBe("iba_official");
    expect(result.sourceUrl).toBe("https://iba-world.com/mojito/");
    expect(result.citations[0].title).toBe("Mojito");
  });
});
