import { CocktailVisual } from "./CocktailVisual";
import { getIngredientName } from "../data/ingredients";
import { getCocktailVisualSpec } from "../data/cocktailVisuals";
import type { AgentRecommendationBundle, Citation, TrustSignal } from "../domain/agentTypes";
import type { CocktailRecommendation } from "../domain/types";
import { triggerHaptic } from "../utils/haptics";
import { getRecipeAuditEntry } from "../data/recipeAudit";
import { Bookmark, ChevronDown, ChevronLeft, ShieldCheck } from "lucide-react";

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
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
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
  onTryAnother,
  isFavorite = false,
  onToggleFavorite
}: ResultViewProps) {
  const { cocktail } = recommendation;
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
  const requiredIngredientIds = cocktail.ingredients.filter((ingredient) => !ingredient.optional).map((ingredient) => ingredient.ingredientId);
  const availableIngredientIds = requiredIngredientIds.filter((ingredientId) => ownedIngredientIds.includes(ingredientId));
  const unavailableIngredientIds = requiredIngredientIds.filter((ingredientId) => !ownedIngredientIds.includes(ingredientId));
  const audit = getRecipeAuditEntry(cocktail.id);
  const confidencePercent = agentPrimary ? Math.round(agentPrimary.confidence * 100) : null;
  const sourceLabel = agentPrimary?.source === "external_verified"
    ? "外部已核验"
    : agentPrimary?.source === "external_inspiration"
      ? "外部灵感"
      : agentPrimary?.source === "classic_twist"
        ? "经典改造"
        : "本地经典酒单";

  return (
    <section className="screen result-screen">
      <header className="result-topbar">
        <button className="result-topbar-button" type="button" aria-label="返回上一页" onClick={() => { triggerHaptic("selection"); onBack(); }}>
          <ChevronLeft aria-hidden="true" strokeWidth={1.7} />
        </button>
        <span>酒款详情</span>
        {onToggleFavorite ? (
          <button className={`result-topbar-button ${isFavorite ? "selected" : ""}`} type="button" aria-label={isFavorite ? "取消收藏" : "存入酒柜"} aria-pressed={isFavorite} onClick={() => { triggerHaptic("selection"); onToggleFavorite(); }}>
            <Bookmark aria-hidden="true" strokeWidth={1.7} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        ) : <span />}
      </header>

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

      {isIngredientMode && !isExternalRecommendation && (
        <div className={`ingredient-readiness ${unavailableIngredientIds.length === 0 ? "ready" : ""}`}>
          <span>{availableIngredientIds.length}/{requiredIngredientIds.length} 项已有</span>
          <p>{unavailableIngredientIds.length
            ? `还差：${unavailableIngredientIds.map(getIngredientName).join("、")}`
            : "材料齐了，今晚就能调"}</p>
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

      <details className="recipe-provenance">
        <summary>
          <span><ShieldCheck aria-hidden="true" strokeWidth={1.7} />配方与来源说明</span>
          <ChevronDown aria-hidden="true" strokeWidth={1.7} />
        </summary>
        <div className="recipe-provenance-content">
          {trustSignals.length > 0 && (
            <div className="trust-signal-row">
              {trustSignals.map((signal) => <span key={`${signal.type}-${signal.label}`} title={signal.description}>{signal.label}</span>)}
            </div>
          )}
          {agentPrimary && (
            <div className="recommendation-confidence" aria-label={`推荐可信度 ${confidencePercent}%`}>
              <span>{sourceLabel}</span>
              <div><i style={{ width: `${confidencePercent}%` }} /></div>
              <strong>{confidencePercent}%</strong>
            </div>
          )}
          {!isExternalRecommendation && (
            <div className={`recipe-audit-note ${audit.status}`}>
              <strong>{audit.status === "verified" ? "官方方法已核对" : "酒单内部已复核"}</strong>
              <span>{audit.source} · {audit.note}</span>
              {audit.sourceUrl && <a href={audit.sourceUrl} target="_blank" rel="noreferrer">查看来源</a>}
            </div>
          )}
          {citations.length > 0 && (
            <div className="citation-card">
              <span className="group-label">参考来源</span>
              {citations.map((citation) => <a key={citation.url} href={citation.url} target="_blank" rel="noreferrer">{citation.title || citation.url}</a>)}
            </div>
          )}
        </div>
      </details>

      <div className="secondary-action-dock split-actions">
        {onSwapDrink && (
          <button className="secondary-action" onClick={() => { triggerHaptic("selection"); onSwapDrink(); }}>换一杯</button>
        )}
        {!isExternalRecommendation && (
          <button className="primary-action" onClick={() => { triggerHaptic("action"); onTryAnother(); }}>开始调制</button>
        )}
      </div>
    </section>
  );
}
