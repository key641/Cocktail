import { cocktails } from "../src/data/cocktails";
import { ingredientById } from "../src/data/ingredients";
import { getRecipeAuditEntry } from "../src/data/recipeAudit";
import { getStepPresentation } from "../src/components/FollowAlongView";

const errors: string[] = [];
const cocktailIds = new Set<string>();

for (const cocktail of cocktails) {
  if (cocktailIds.has(cocktail.id)) errors.push(`${cocktail.id}: duplicated cocktail id`);
  cocktailIds.add(cocktail.id);
  if (!cocktail.ingredients.length) errors.push(`${cocktail.id}: missing ingredients`);
  if (!cocktail.steps.length) errors.push(`${cocktail.id}: missing steps`);
  if (!cocktail.garnish.trim()) errors.push(`${cocktail.id}: missing garnish description`);

  for (const ingredient of cocktail.ingredients) {
    if (!ingredientById.has(ingredient.ingredientId)) errors.push(`${cocktail.id}: unknown ingredient ${ingredient.ingredientId}`);
    if (!ingredient.amount.trim()) errors.push(`${cocktail.id}: missing amount for ${ingredient.ingredientId}`);
  }

  cocktail.steps.forEach((step, index) => {
    const presentation = getStepPresentation(cocktail, step, index, cocktail.steps.length);
    if (presentation.label.startsWith("第")) errors.push(`${cocktail.id}: generic animation mapping at step ${index + 1}`);
  });

  const audit = getRecipeAuditEntry(cocktail.id);
  if (!audit.note.trim()) errors.push(`${cocktail.id}: missing audit note`);
  if (audit.status === "verified" && !audit.sourceUrl) errors.push(`${cocktail.id}: verified recipe missing source URL`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  const verified = cocktails.filter((cocktail) => getRecipeAuditEntry(cocktail.id).status === "verified").length;
  console.log(`Validated ${cocktails.length} cocktails, ${cocktails.reduce((sum, cocktail) => sum + cocktail.steps.length, 0)} steps, ${verified} IBA-verified recipes.`);
}

