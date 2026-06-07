import { ingredients } from "../data/ingredients";
import type { ParsedIngredients } from "./types";

const splitter = /[,，、\n;；。.]+/;

function normalize(value: string) {
  return value.trim().toLowerCase();
}

const aliasEntries = ingredients.flatMap((ingredient) => {
  const names = [ingredient.id, ingredient.name, ...ingredient.aliases];
  return names.map((alias) => ({ alias: normalize(alias), ingredientId: ingredient.id }));
});

export function parseIngredientsLocally(input: string): ParsedIngredients {
  const normalizedInput = normalize(input);
  const found = aliasEntries
    .map((entry) => ({ ...entry, index: normalizedInput.indexOf(entry.alias) }))
    .filter((entry) => entry.alias && entry.index >= 0)
    .sort((a, b) => a.index - b.index || b.alias.length - a.alias.length)
    .reduce<string[]>((ingredientIds, entry) => {
      if (!ingredientIds.includes(entry.ingredientId)) {
        ingredientIds.push(entry.ingredientId);
      }
      return ingredientIds;
    }, []);

  const unknown = input
    .split(splitter)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const normalizedPart = normalize(part);
      return !aliasEntries.some((entry) => normalizedPart.includes(entry.alias) || entry.alias.includes(normalizedPart));
    });

  return {
    ingredients: found,
    unknown: Array.from(new Set(unknown))
  };
}
