import { describe, expect, it } from "vitest";
import { exactCocktailFromQuery, retrieveCocktailCandidates } from "./cocktailRetrieval";

describe("cocktail retrieval", () => {
  it.each([
    ["莫吉托怎么做", "mojito"],
    ["Mojito recipe", "mojito"],
    ["给我看看 Margarita 的配方", "margarita"]
  ])("resolves an explicit cocktail entity from %s", (query, expectedId) => {
    expect(exactCocktailFromQuery(query)?.id).toBe(expectedId);
  });

  it("retrieves semantic keyword candidates without sending the whole catalog to a model", () => {
    const results = retrieveCocktailCandidates("想喝薄荷青柠、像汽水一样清爽的");

    expect(results.slice(0, 3).map((item) => item.cocktail.id)).toContain("mojito");
    expect(results[0].evidence.length).toBeGreaterThan(0);
  });

  it.each([
    ["想要葡萄柚苏打，明亮微苦", "paloma"],
    ["庆祝用，轻盈、有香槟气泡和仪式感", "french-75"],
    ["极简一点，金酒汤力，清冷干净", "gin-tonic"],
    ["薄荷青柠，夏天喝的清爽长饮", "mojito"]
  ])("keeps the expected cocktail in the top three for %s", (query, expectedId) => {
    const topThree = retrieveCocktailCandidates(query, 3).map((item) => item.cocktail.id);

    expect(topThree).toContain(expectedId);
  });
});
