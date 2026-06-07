import { getIngredientName } from "../data/ingredients";
import type { Cocktail } from "../domain/types";

type CocktailCardProps = {
  cocktail: Cocktail;
  ambient?: boolean;
};

export function CocktailCard({ cocktail, ambient = false }: CocktailCardProps) {
  return (
    <article className={ambient ? "ambient-card cocktail-card" : "cocktail-card"}>
      <div className="liquid-orbit">
        <span />
        <span />
      </div>
      <div className="card-head">
        <span>{cocktail.englishName}</span>
        <span>{cocktail.strength}</span>
      </div>
      <h3>{cocktail.name}</h3>
      <p>{cocktail.intro}</p>
      <div className="tag-row">
        {cocktail.tags.map((tag) => <span key={tag}>{tag}</span>)}
      </div>
      {!ambient && (
        <div className="micro-list">
          {cocktail.ingredients.slice(0, 4).map((item) => (
            <span key={item.ingredientId}>{getIngredientName(item.ingredientId)} · {item.amount}</span>
          ))}
        </div>
      )}
    </article>
  );
}
