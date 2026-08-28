import { CocktailVisual } from "./CocktailVisual";
import { getIngredientName } from "../data/ingredients";
import { getCocktailVisualSpec } from "../data/cocktailVisuals";
import type { AgentRecommendationBundle, Citation, TrustSignal } from "../domain/agentTypes";
import type { CocktailRecommendation } from "../domain/types";
import { SecondaryHeader } from "./SecondaryHeader";

type ResultViewProps = {
  recommendation: CocktailRecommendation;
  ownedIngredientIds: string[];
  ownedNames: string[];
  unknownIngredients: string[];
  bartenderLine?: string;
  agentRecommendation?: AgentRecommendationBundle;
  trustSignals?: TrustSignal[];
  citations?: Citation[];
  onBack: () => void;
  onSwapDrink?: () => void;
  onTryAnother: () => void;
};

export function ResultView({
  recommendation,
  ownedIngredientIds,
  ownedNames,
  unknownIngredients,
  bartenderLine,
  agentRecommendation,
  trustSignals = [],
  citations = [],
  onBack,
  onSwapDrink,
  onTryAnother
}: ResultViewProps) {
  const { cocktail, ownedIngredients, missingIngredients } = recommendation;
  const agentPrimary = agentRecommendation?.primary;
  const isExternalRecommendation = agentPrimary?.recipeMode === "external";
  const isIngredientMode = ownedIngredientIds.length > 0;
  const recommendationReason = agentRecommendation?.narrative?.recommendationReason ?? bartenderLine;

  const displayName = isExternalRecommendation ? agentPrimary.name : cocktail.englishName;
  const displaySubtitle = isExternalRecommendation ? "外部查证酒款" : cocktail.name;
  const displayTags = isExternalRecommendation ? agentPrimary.tags : cocktail.tags;
  const recipeIngredients = isExternalRecommendation
    ? agentPrimary.recipe?.ingredients ?? []
    : cocktail.ingredients.map((ingredient) => ({
        name: getIngredientName(ingredient.ingredientId),
        amount: ingredient.amount,
        optional: ingredient.optional
      }));
  const recipeSteps = isExternalRecommendation ? agentPrimary.recipe?.steps ?? [] : cocktail.steps;
  const bartenderTip = isExternalRecommendation ? agentPrimary.recipe?.bartenderTip || agentPrimary.reason : cocktail.bartenderTip;

  return (
    <section className="screen result-screen">
      <SecondaryHeader
        title="酒保为你选了这一杯"
        description="先看风味，再决定要不要动手"
        backLabel="返回上一页"
        onBack={onBack}
      />

      <article className="hero-recommendation-card">
        {isExternalRecommendation ? (
          <div className="external-visual-placeholder">
            <span>{agentPrimary.displayVisualFallback?.glass || agentPrimary.recipe?.glass || "Cocktail"}</span>
            <strong>{displayName.slice(0, 1)}</strong>
          </div>
        ) : (
          <CocktailVisual spec={getCocktailVisualSpec(cocktail.id)} title={cocktail.englishName} />
        )}
        <div className="recommendation-copy">
          <h2>{displayName}</h2>
          <p>{displaySubtitle}</p>
          <div className="tag-row">
            {displayTags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          {recommendationReason && (
            <div className="hero-reason">
              <strong>为什么是它</strong>
              <p>{recommendationReason}</p>
            </div>
          )}
        </div>
      </article>

      {trustSignals.length > 0 && (
        <div className="trust-signal-row">
          {trustSignals.map((signal) => (
            <span key={`${signal.type}-${signal.label}`} title={signal.description}>{signal.label}</span>
          ))}
        </div>
      )}

      {citations.length > 0 && (
        <div className="citation-card">
          <span className="group-label">来源</span>
          {citations.map((citation) => (
            <a key={citation.url} href={citation.url} target="_blank" rel="noreferrer">
              {citation.title || citation.url}
            </a>
          ))}
        </div>
      )}

      <div className="recipe-block result-recipe">
        <div className="content-section-head"><strong>所需材料</strong><span>{recipeIngredients.length} 项</span></div>
        {recipeIngredients.map((ingredient) => (
          <div className="recipe-line" key={`${ingredient.name}-${ingredient.amount}`}>
            <span>{ingredient.name}</span>
            <span>{ingredient.amount}{ingredient.optional ? " · 可选" : ""}</span>
          </div>
        ))}
      </div>

      {isIngredientMode && !isExternalRecommendation && (
        <div className="shopping-grid">
          <div>
            <span className="group-label">你已经有</span>
            <p>{ownedIngredients.length ? ownedIngredients.map(getIngredientName).join("、") : ownedNames.join("、") || "暂未匹配到核心材料"}</p>
          </div>
          <div>
            <span className="group-label">建议补买</span>
            <p>{missingIngredients.length ? missingIngredients.map(getIngredientName).join("、") : "不用买，今晚就能调"}</p>
          </div>
        </div>
      )}

      {unknownIngredients.length > 0 && (
        <div className="soft-warning">暂未识别：{unknownIngredients.join("、")}。可以先按点选材料继续。</div>
      )}

      <div className="steps-block result-steps">
        <div className="content-section-head"><strong>制作步骤</strong><span>{recipeSteps.length} 步</span></div>
        {recipeSteps.map((step, index) => (
          <div className="step-line" key={step}>
            <span>{index + 1}</span>
            <p>{step}</p>
          </div>
        ))}
      </div>

      <div className="insight-panel bartender-tip">
        <strong>小贴士</strong>
        <p>{bartenderTip}</p>
      </div>

      <div className="secondary-action-dock split-actions">
        <button className="secondary-action" onClick={onSwapDrink ?? onBack}>换一杯</button>
        {!isExternalRecommendation && (
          <button className="primary-action" onClick={onTryAnother}>开始调制</button>
        )}
      </div>
    </section>
  );
}
