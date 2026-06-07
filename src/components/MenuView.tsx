import { CocktailVisual } from "./CocktailVisual";
import { getCocktailVisualSpec } from "../data/cocktailVisuals";
import type { Cocktail, CocktailRecommendation } from "../domain/types";

type MenuViewProps = {
  cocktails: Cocktail[];
  onBack: () => void;
  onSelect: (recommendation: CocktailRecommendation) => void;
};

const strengthLabels = {
  light: "轻盈",
  medium: "适中",
  strong: "偏烈"
} as const;

function recommendationFor(cocktail: Cocktail): CocktailRecommendation {
  const requiredIngredients = cocktail.ingredients.filter((ingredient) => !ingredient.optional).map((ingredient) => ingredient.ingredientId);
  return {
    cocktail,
    ownedIngredients: [],
    missingIngredients: requiredIngredients,
    score: 100,
    reason: `这是一杯经典的 ${cocktail.englishName}，适合查看当前 SVG 酒图与配方结构。`
  };
}

export function MenuView({ cocktails, onBack, onSelect }: MenuViewProps) {
  return (
    <section className="screen menu-screen">
      <button className="ghost-button icon-back" onClick={onBack}>←</button>

      <div className="section-heading centered">
        <h2>当前酒单</h2>
        <p>查看每款经典酒的 SVG 参考图</p>
      </div>

      <div className="menu-grid">
        {cocktails.map((cocktail) => (
          <button key={cocktail.id} className="menu-card" onClick={() => onSelect(recommendationFor(cocktail))}>
            <CocktailVisual spec={getCocktailVisualSpec(cocktail.id)} title={cocktail.englishName} />
            <span>{cocktail.englishName}</span>
            <strong>{cocktail.name}</strong>
            <small>{cocktail.glass} · {strengthLabels[cocktail.strength]}</small>
            <div className="tag-row">
              {cocktail.tags.slice(0, 2).map((tag) => <em key={tag}>{tag}</em>)}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
