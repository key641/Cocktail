import { cocktails } from "../data/cocktails";
import { getIngredientName } from "../data/ingredients";
import type { CocktailRecommendation } from "../domain/types";
import type { UserProfile } from "../domain/userProfile";
import { CocktailVisual } from "./CocktailVisual";
import { getCocktailVisualSpec } from "../data/cocktailVisuals";
import { triggerHaptic } from "../utils/haptics";

type MyBarViewProps = {
  profile: UserProfile;
  feedbackCount: number;
  onManageIngredients: () => void;
  onSelectCocktail: (recommendation: CocktailRecommendation) => void;
  onClearHistory: () => void;
};

function recommendationForId(id: string, ownedIngredientIds: string[]): CocktailRecommendation | null {
  const cocktail = cocktails.find((item) => item.id === id);
  if (!cocktail) return null;
  const requiredIngredients = cocktail.ingredients.filter((item) => !item.optional).map((item) => item.ingredientId);
  return {
    cocktail,
    ownedIngredients: requiredIngredients.filter((id) => ownedIngredientIds.includes(id)),
    missingIngredients: requiredIngredients.filter((id) => !ownedIngredientIds.includes(id)),
    score: 100,
    reason: "这是你保存过的一杯，可以继续查看配方或跟着制作。"
  };
}

export function MyBarView({ profile, feedbackCount, onManageIngredients, onSelectCocktail, onClearHistory }: MyBarViewProps) {
  const favoriteCocktails = profile.favoriteCocktailIds.map((id) => recommendationForId(id, profile.barIngredientIds)).filter(Boolean) as CocktailRecommendation[];
  const recentCocktails = profile.recentCocktailIds.map((id) => recommendationForId(id, profile.barIngredientIds)).filter(Boolean).slice(0, 6) as CocktailRecommendation[];

  return (
    <section className="screen my-bar-screen">
      <div className="section-heading">
        <span className="eyebrow">MY BAR</span>
        <h2>我的酒柜</h2>
        <p>收藏、材料和最近看过的酒，都放在这里。</p>
      </div>

      <div className="my-bar-summary">
        <div><strong>{profile.barIngredientIds.length}</strong><span>种现有材料</span></div>
        <div><strong>{favoriteCocktails.length}</strong><span>杯收藏</span></div>
        <div><strong>{feedbackCount}</strong><span>条反馈</span></div>
      </div>

      <section className="my-bar-section">
        <div className="content-section-head"><strong>手边材料</strong><button type="button" onClick={onManageIngredients}>管理材料</button></div>
        {profile.barIngredientIds.length ? (
          <div className="chip-row wrap">{profile.barIngredientIds.map((id) => <span className="chip selected" key={id}>{getIngredientName(id)}</span>)}</div>
        ) : (
          <button className="my-bar-empty" type="button" onClick={onManageIngredients}>还没记录材料，点这里建立你的酒柜</button>
        )}
      </section>

      <section className="my-bar-section">
        <div className="content-section-head"><strong>我的收藏</strong><span>{favoriteCocktails.length} 杯</span></div>
        {favoriteCocktails.length ? <div className="my-cocktail-row">{favoriteCocktails.map((item) => (
          <button key={item.cocktail.id} type="button" onClick={() => { triggerHaptic("selection"); onSelectCocktail(item); }}>
            <CocktailVisual spec={getCocktailVisualSpec(item.cocktail.id)} title={item.cocktail.englishName} />
            <strong>{item.cocktail.englishName}</strong><span>{item.cocktail.name}</span>
          </button>
        ))}</div> : <p className="my-bar-muted">在酒款详情点收藏，喜欢的酒会出现在这里。</p>}
      </section>

      <section className="my-bar-section">
        <div className="content-section-head"><strong>最近看过</strong>{recentCocktails.length ? <button type="button" onClick={() => { triggerHaptic("selection"); onClearHistory(); }}>清空</button> : <span>0 杯</span>}</div>
        {recentCocktails.length ? <div className="my-recent-list">{recentCocktails.map((item) => (
          <button key={item.cocktail.id} type="button" onClick={() => onSelectCocktail(item)}><span>{item.cocktail.englishName}</span><small>{item.cocktail.name}</small><em>→</em></button>
        ))}</div> : <p className="my-bar-muted">你看过的酒会自动保留在这里。</p>}
      </section>

      <section className="my-bar-section preference-memory">
        <div className="content-section-head"><strong>酒保记住的偏好</strong><span>仅保存在此设备</span></div>
        <p>{profile.agentSession.preferredFlavors.length ? `喜欢：${profile.agentSession.preferredFlavors.join("、")}` : "聊得越多，酒保越懂你的口味。"}</p>
      </section>
    </section>
  );
}
