import { cocktailSemanticProfiles } from "../data/cocktailSemanticProfiles";
import { cocktails } from "../data/cocktails";
import { getIngredientName } from "../data/ingredients";
import type { Cocktail } from "./types";

export type CocktailRetrievalCandidate = {
  cocktail: Cocktail;
  score: number;
  evidence: string[];
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[\s\-_&]+/g, "");
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function searchableTerms(cocktail: Cocktail) {
  const semantic = cocktailSemanticProfiles.find((item) => item.cocktailId === cocktail.id);
  return unique([
    cocktail.id,
    cocktail.name,
    cocktail.englishName,
    cocktail.base,
    ...cocktail.tags,
    ...cocktail.ingredients.map((ingredient) => getIngredientName(ingredient.ingredientId)),
    ...(semantic?.semanticKeywords ?? [])
  ]);
}

export function retrieveCocktailCandidates(query: string, limit = 8): CocktailRetrievalCandidate[] {
  const normalizedQuery = normalize(query);

  return cocktails
    .map((cocktail) => {
      const evidence: string[] = [];
      let score = 0;
      const exactNames = [cocktail.id, cocktail.name, cocktail.englishName].map(normalize);

      for (const name of exactNames) {
        if (name && normalizedQuery.includes(name)) {
          score += 120;
          evidence.push(`酒款名:${name}`);
          break;
        }
      }

      for (const term of searchableTerms(cocktail)) {
        const normalizedTerm = normalize(term);
        if (normalizedTerm.length < 2 || !normalizedQuery.includes(normalizedTerm)) continue;
        const boost = cocktail.tags.includes(term) ? 18 : 10;
        score += boost;
        evidence.push(term);
      }

      return { cocktail, score, evidence: unique(evidence) };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || left.cocktail.name.localeCompare(right.cocktail.name))
    .slice(0, limit);
}

export function exactCocktailFromQuery(query: string) {
  return retrieveCocktailCandidates(query, 1).find((candidate) => candidate.score >= 120)?.cocktail;
}
