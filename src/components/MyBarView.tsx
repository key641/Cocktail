import { useState } from "react";
import { Bookmark, ChevronRight, History, Martini, PackageOpen, SlidersHorizontal, Trash2 } from "lucide-react";
import { cocktails } from "../data/cocktails";
import { getIngredientName } from "../data/ingredients";
import type { CocktailRecommendation } from "../domain/types";
import type { UserProfile } from "../domain/userProfile";
import { CocktailVisual } from "./CocktailVisual";
import { getCocktailVisualSpec } from "../data/cocktailVisuals";
import { triggerHaptic } from "../utils/haptics";

type MyBarViewProps = {
  profile: UserProfile;
  onManageIngredients: () => void;
  onSelectCocktail: (recommendation: CocktailRecommendation) => void;
  onClearHistory: () => void;
};

type BarSection = "favorites" | "ingredients" | "recent";

function recommendationForId(id: string, ownedIngredientIds: string[]): CocktailRecommendation | null {
  const cocktail = cocktails.find((item) => item.id === id);
  if (!cocktail) return null;
  const requiredIngredients = cocktail.ingredients.filter((item) => !item.optional).map((item) => item.ingredientId);
  return {
    cocktail,
    ownedIngredients: requiredIngredients.filter((ingredientId) => ownedIngredientIds.includes(ingredientId)),
    missingIngredients: requiredIngredients.filter((ingredientId) => !ownedIngredientIds.includes(ingredientId)),
    score: 100,
    reason: "这是你保存过的一杯，可以继续查看配方或跟着制作。"
  };
}

export function MyBarView({ profile, onManageIngredients, onSelectCocktail, onClearHistory }: MyBarViewProps) {
  const [activeSection, setActiveSection] = useState<BarSection>("favorites");
  const favoriteCocktails = profile.favoriteCocktailIds.map((id) => recommendationForId(id, profile.barIngredientIds)).filter(Boolean) as CocktailRecommendation[];
  const recentCocktails = profile.recentCocktailIds.map((id) => recommendationForId(id, profile.barIngredientIds)).filter(Boolean).slice(0, 6) as CocktailRecommendation[];
  const makeableCount = cocktails.filter((cocktail) => cocktail.ingredients
    .filter((ingredient) => !ingredient.optional)
    .every((ingredient) => profile.barIngredientIds.includes(ingredient.ingredientId))).length;
  const preferenceText = profile.agentSession.preferredFlavors.length
    ? `喜欢：${profile.agentSession.preferredFlavors.join("、")}`
    : "聊得越多，酒保越懂你的口味。";

  function selectSection(section: BarSection) {
    if (section === activeSection) return;
    triggerHaptic("selection");
    setActiveSection(section);
  }

  function openCocktail(item: CocktailRecommendation) {
    triggerHaptic("selection");
    onSelectCocktail(item);
  }

  return (
    <section className="screen my-bar-screen">
      <header className="my-bar-heading">
        <h2>我的酒柜</h2>
        <p>把喜欢的酒和家里的材料，慢慢收进来。</p>
      </header>

      <section className="bar-status-card" aria-label="酒柜状态">
        <div className="bar-status-icon"><Martini aria-hidden="true" strokeWidth={1.6} /></div>
        <div>
          <span>今晚的酒柜</span>
          <strong>{profile.barIngredientIds.length} 种材料</strong>
          <p>{makeableCount > 0 ? `现在可以完整调出 ${makeableCount} 杯` : "再补几样，就能完整调出第一杯"}</p>
        </div>
        <button type="button" onClick={onManageIngredients} aria-label="管理酒柜材料">
          <SlidersHorizontal aria-hidden="true" strokeWidth={1.7} />
          <span>管理</span>
        </button>
      </section>

      <nav className="my-bar-tabs" aria-label="我的酒柜内容">
        <button className={activeSection === "favorites" ? "active" : ""} type="button" aria-pressed={activeSection === "favorites"} onClick={() => selectSection("favorites")}>
          <Bookmark aria-hidden="true" strokeWidth={1.7} /><span>收藏</span><em>{favoriteCocktails.length}</em>
        </button>
        <button className={activeSection === "ingredients" ? "active" : ""} type="button" aria-pressed={activeSection === "ingredients"} onClick={() => selectSection("ingredients")}>
          <PackageOpen aria-hidden="true" strokeWidth={1.7} /><span>材料</span><em>{profile.barIngredientIds.length}</em>
        </button>
        <button className={activeSection === "recent" ? "active" : ""} type="button" aria-pressed={activeSection === "recent"} onClick={() => selectSection("recent")}>
          <History aria-hidden="true" strokeWidth={1.7} /><span>最近</span><em>{recentCocktails.length}</em>
        </button>
      </nav>

      <div className="my-bar-content">
        {activeSection === "favorites" && (
          <section aria-labelledby="favorite-heading">
            <div className="my-bar-content-head"><div><h3 id="favorite-heading">收藏的酒</h3><p>想再喝时，从这里直接开始。</p></div></div>
            {favoriteCocktails.length ? (
              <div className="saved-cocktail-list">{favoriteCocktails.map((item) => (
                <button key={item.cocktail.id} type="button" onClick={() => openCocktail(item)}>
                  <CocktailVisual spec={getCocktailVisualSpec(item.cocktail.id)} title={item.cocktail.englishName} />
                  <span><strong>{item.cocktail.englishName}</strong><small>{item.cocktail.name} · {item.cocktail.tags.slice(0, 2).join(" · ")}</small></span>
                  <ChevronRight aria-hidden="true" strokeWidth={1.7} />
                </button>
              ))}</div>
            ) : (
              <div className="my-bar-empty-state"><Bookmark aria-hidden="true" strokeWidth={1.5} /><strong>还没有收藏</strong><p>看到想留着慢慢喝的酒，用书签存进来。</p></div>
            )}
          </section>
        )}

        {activeSection === "ingredients" && (
          <section aria-labelledby="ingredient-heading">
            <div className="my-bar-content-head"><div><h3 id="ingredient-heading">手边材料</h3><p>酒保会优先用这些材料推荐。</p></div><button type="button" onClick={onManageIngredients}><SlidersHorizontal aria-hidden="true" />编辑</button></div>
            {profile.barIngredientIds.length ? (
              <div className="ingredient-shelf">{profile.barIngredientIds.map((id) => <span key={id}>{getIngredientName(id)}</span>)}</div>
            ) : (
              <button className="my-bar-empty-state actionable" type="button" onClick={onManageIngredients}><PackageOpen aria-hidden="true" strokeWidth={1.5} /><strong>酒柜还是空的</strong><p>添加家里现有的酒和辅料，推荐会更准确。</p></button>
            )}
          </section>
        )}

        {activeSection === "recent" && (
          <section aria-labelledby="recent-heading">
            <div className="my-bar-content-head"><div><h3 id="recent-heading">最近看过</h3><p>继续刚才没看完的那一杯。</p></div>{recentCocktails.length > 0 && <button type="button" onClick={() => { triggerHaptic("selection"); onClearHistory(); }}><Trash2 aria-hidden="true" />清空</button>}</div>
            {recentCocktails.length ? (
              <div className="recent-cocktail-list">{recentCocktails.map((item) => (
                <button key={item.cocktail.id} type="button" onClick={() => openCocktail(item)}><span><strong>{item.cocktail.englishName}</strong><small>{item.cocktail.name}</small></span><ChevronRight aria-hidden="true" strokeWidth={1.7} /></button>
              ))}</div>
            ) : (
              <div className="my-bar-empty-state"><History aria-hidden="true" strokeWidth={1.5} /><strong>最近还没看过酒</strong><p>浏览过的酒会暂时留在这里，方便接着看。</p></div>
            )}
          </section>
        )}
      </div>

      <aside className="preference-memory">
        <span>酒保记住的口味</span>
        <p>{preferenceText}</p>
        <small>仅保存在此设备</small>
      </aside>
    </section>
  );
}
