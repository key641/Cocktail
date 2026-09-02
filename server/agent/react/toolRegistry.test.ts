import { describe, expect, it } from "vitest";
import { externalRef, reactToolRegistry, type ReActRunContext } from "./toolRegistry";
import { createReActStore, ReActToolArgsError } from "./types";

function createContext(session?: ReActRunContext["session"]): ReActRunContext {
  return { client: undefined, session, store: createReActStore() };
}

describe("reactToolRegistry", () => {
  it("search_cocktails resolves a direct local cocktail name", async () => {
    const ctx = createContext();
    const observation = await reactToolRegistry.search_cocktails.run(
      { query: "莫吉托" },
      ctx
    ) as { exact_match: { ref: string } | null };

    expect(observation.exact_match?.ref).toBe("mojito");
    expect(ctx.store.localCandidates.has("mojito")).toBe(true);
    expect(ctx.store.lastMatch?.primary.cocktail.id).toBe("mojito");
  });

  it("match_cocktails normalizes Chinese flavor aliases and drops unknown tokens with a note", async () => {
    const ctx = createContext();
    const observation = await reactToolRegistry.match_cocktails.run(
      { flavors: ["清爽", "sour", "威士忌感"], semantic_query: "清爽酸一点" },
      ctx
    ) as { primary: { ref: string; score: number }; note?: string };

    expect(observation.primary.ref).toBeTruthy();
    expect(observation.note).toContain("威士忌感");
    expect(ctx.store.lastMatch?.preference.flavorPreferences).toEqual(["refreshing", "sour"]);
    expect(ctx.store.localCandidates.has(observation.primary.ref)).toBe(true);
  });

  it("match_cocktails resolves ingredient names and aliases to ids", async () => {
    const ctx = createContext();
    const observation = await reactToolRegistry.match_cocktails.run(
      { available_ingredient_ids: ["金酒", "vodka", "不存在的材料"] },
      ctx
    ) as { note?: string };

    expect(ctx.store.lastMatch?.preference.availableIngredients).toEqual(["gin", "vodka"]);
    expect(ctx.store.lastMatch?.preference.requestType).toBe("ingredient_matching");
    expect(observation.note).toContain("不存在的材料");
  });

  it("match_cocktails swaps out a rejected primary for a clean alternative", async () => {
    // 先跑一次拿到默认主推荐，再把它标记为已拒绝
    const probeCtx = createContext();
    const probe = await reactToolRegistry.match_cocktails.run({ flavors: ["refreshing"] }, probeCtx) as {
      primary: { ref: string };
      alternatives: Array<{ ref: string }>;
    };
    expect(probe.alternatives.length).toBeGreaterThan(0);

    const ctx = createContext({
      preferredFlavors: [],
      dislikedFlavors: [],
      availableIngredients: [],
      lastRecommendationIds: [],
      rejectedRecommendationIds: [probe.primary.ref]
    });
    const observation = await reactToolRegistry.match_cocktails.run({ flavors: ["refreshing"] }, ctx) as {
      primary: { ref: string };
      note?: string;
    };

    expect(observation.primary.ref).not.toBe(probe.primary.ref);
    expect(observation.note).toContain("拒绝");
  });

  it("get_cocktail_recipe rejects ids that are not in the local menu", async () => {
    const ctx = createContext();
    await expect(
      reactToolRegistry.get_cocktail_recipe.run({ cocktail_id: "no-such-drink" }, ctx)
    ).rejects.toThrow(ReActToolArgsError);
  });

  it("get_cocktail_recipe returns full recipe for a valid id", async () => {
    const ctx = createContext();
    const observation = await reactToolRegistry.get_cocktail_recipe.run({ cocktail_id: "mojito" }, ctx) as {
      name: string;
      ingredients: unknown[];
      steps: string[];
    };

    expect(observation.name).toBeTruthy();
    expect(observation.ingredients.length).toBeGreaterThan(0);
    expect(observation.steps.length).toBeGreaterThan(0);
  });

  it("suggest_classic_twist stores the twist in the run store", async () => {
    const ctx = createContext();
    const observation = await reactToolRegistry.suggest_classic_twist.run(
      { cocktail_id: "negroni", flavors: ["sweet"], strength: "low" },
      ctx
    ) as { base_ref: string; twist_title: string };

    expect(observation.base_ref).toBe("negroni");
    expect(observation.twist_title).toBeTruthy();
    expect(ctx.store.twist?.baseCocktailId).toBe("negroni");
  });

  it("search_external_recipe reports unavailable without a client", async () => {
    const ctx = createContext();
    const observation = await reactToolRegistry.search_external_recipe.run(
      { query: "Paper Plane cocktail recipe" },
      ctx
    ) as { status: string };

    expect(observation.status).toBe("unavailable");
    expect(ctx.store.externalRecipes.size).toBe(0);
  });

  it("generate_share_caption validates the style enum", async () => {
    const ctx = createContext();
    await expect(
      reactToolRegistry.generate_share_caption.run({ cocktail_id: "mojito", style: "haiku" }, ctx)
    ).rejects.toThrow(ReActToolArgsError);

    const observation = await reactToolRegistry.generate_share_caption.run(
      { cocktail_id: "mojito" },
      ctx
    ) as { ref: string };
    expect(observation.ref).toBe("mojito");
    expect(ctx.store.shareCaption).toBeDefined();
  });

  it("externalRef slugifies cocktail names consistently", () => {
    expect(externalRef("Paper Plane")).toBe("external-paper-plane");
    expect(externalRef("Añejo Highball!")).toBe("external-a-ejo-highball");
  });
});
