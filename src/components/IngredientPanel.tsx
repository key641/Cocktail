import { useMemo, useState } from "react";
import { ingredients } from "../data/ingredients";
import type { IngredientCategory, TasteProfile } from "../domain/types";
import { SecondaryHeader } from "./SecondaryHeader";
import { triggerHaptic } from "../utils/haptics";
import { Check, Search, Trash2, X } from "lucide-react";

type IngredientPanelProps = {
  isParsing: boolean;
  onBack: () => void;
  onComplete: (selected: string[], freeText: string, tasteProfile: TasteProfile) => void;
  initialSelected?: string[];
  saveLabel?: string;
  title?: string;
  description?: string;
  backLabel?: string;
  allowEmpty?: boolean;
  mode?: "recommend" | "manage";
};

const categoryLabels: Record<IngredientCategory, string> = {
  spirit: "基酒",
  liqueur: "利口酒",
  citrus: "柑橘",
  sweetener: "甜味",
  juice: "果汁",
  bitter: "苦精/风味",
  mixer: "气泡/兑饮",
  herb: "香草",
  garnish: "装饰"
};

const tasteLabels: Array<[keyof TasteProfile, string]> = [
  ["fresh", "清爽"],
  ["sour", "酸感"],
  ["fruity", "果味"]
];

const defaultTaste: TasteProfile = { sweet: 2, sour: 3, bitter: 1, fresh: 4, strong: 2, fruity: 2, herbal: 1, bubbly: 0 };
const categoryOrder: IngredientCategory[] = ["spirit", "liqueur", "citrus", "juice", "mixer", "sweetener", "bitter", "herb", "garnish"];

export function IngredientPanel({
  isParsing,
  onBack,
  onComplete,
  initialSelected,
  saveLabel,
  title = "看看手边能调什么",
  description = "写一句话，或按类别补充材料",
  backLabel = "返回首页",
  allowEmpty = false,
  mode = "recommend"
}: IngredientPanelProps) {
  const [selected, setSelected] = useState<string[]>(initialSelected ?? ["gin", "lemon-juice", "simple-syrup"]);
  const [freeText, setFreeText] = useState("");
  const [taste, setTaste] = useState<TasteProfile>(defaultTaste);
  const [activeCategory, setActiveCategory] = useState<IngredientCategory>("spirit");
  const [searchQuery, setSearchQuery] = useState("");
  const isManageMode = mode === "manage";

  const grouped = useMemo(() => {
    return ingredients.reduce<Record<string, typeof ingredients>>((groups, ingredient) => {
      groups[ingredient.category] = groups[ingredient.category] ?? [];
      groups[ingredient.category].push(ingredient);
      return groups;
    }, {});
  }, []);
  const selectedIngredients = ingredients.filter((ingredient) => selected.includes(ingredient.id));
  const activeIngredients = grouped[activeCategory] ?? [];
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const visibleIngredients = normalizedQuery
    ? ingredients.filter((ingredient) => [ingredient.name, ...ingredient.aliases].some((name) => name.toLocaleLowerCase().includes(normalizedQuery)))
    : activeIngredients;
  const selectedCountByCategory = categoryOrder.reduce<Record<IngredientCategory, number>>((counts, category) => {
    counts[category] = selectedIngredients.filter((ingredient) => ingredient.category === category).length;
    return counts;
  }, {} as Record<IngredientCategory, number>);

  function toggleIngredient(id: string) {
    triggerHaptic("selection");
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function updateTaste(key: keyof TasteProfile, value: number) {
    setTaste((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className={`screen preference-screen ingredient-screen ${isManageMode ? "manage-mode" : "recommend-mode"}`}>
      <SecondaryHeader
        title={title}
        description={description}
        progress={isManageMode ? undefined : `已选 ${selected.length} 种`}
        backLabel={backLabel}
        onBack={onBack}
      />

      {isManageMode ? (
        <div className="ingredient-search">
          <Search aria-hidden="true" strokeWidth={1.7} />
          <input
            type="search"
            aria-label="搜索材料"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="搜索材料，如金酒、青柠、汤力水"
          />
          {searchQuery && <button type="button" aria-label="清空搜索" onClick={() => setSearchQuery("")}><X aria-hidden="true" strokeWidth={1.7} /></button>}
        </div>
      ) : (
        <div className="ingredient-composer">
          <label htmlFor="ingredient-description">直接告诉酒保</label>
          <textarea
            id="ingredient-description"
            aria-label="描述你现有的材料"
            className="ingredient-textarea"
            value={freeText}
            onChange={(event) => setFreeText(event.target.value)}
            placeholder="例如：我有龙舌兰、青柠、汤力水，还有一点薄荷"
          />
        </div>
      )}

      <div className="selected-ingredient-strip" aria-live="polite">
        <div>
          <div><strong>{isManageMode ? "酒柜里已有" : "已放上吧台"}</strong><span>{selected.length} 种材料</span></div>
          {isManageMode && selected.length > 0 && <button type="button" onClick={() => { triggerHaptic("selection"); setSelected([]); }}><Trash2 aria-hidden="true" strokeWidth={1.7} />清空</button>}
        </div>
        <div className="chip-row wrap">
          {!selectedIngredients.length && <span className="selected-ingredient-empty">还没有材料，去下面选几样吧</span>}
          {selectedIngredients.map((ingredient) => (
            <button key={ingredient.id} className="chip selected removable" onClick={() => toggleIngredient(ingredient.id)} aria-label={`移除${ingredient.name}`}>
              {ingredient.name}<span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      </div>

      {!isManageMode && <div className="taste-sliders">
        {tasteLabels.map(([key, label]) => (
          <label key={key}>
            <span>{label}</span>
            <input aria-label={`${label}偏好`} type="range" min="0" max="5" value={taste[key]} onChange={(event) => updateTaste(key, Number(event.target.value))} onPointerUp={() => triggerHaptic("selection")} />
          </label>
        ))}
      </div>}

      <div className="ingredient-picker">
        <div className="option-group-head"><strong>{normalizedQuery ? "搜索结果" : isManageMode ? "按类别选择" : "按类别补充"}</strong><span>{normalizedQuery ? `${visibleIngredients.length} 项` : "一次只看一组"}</span></div>
        {!normalizedQuery && <div className="ingredient-category-tabs" role="tablist" aria-label="材料类别">
            {categoryOrder.map((category) => (
              <button key={category} role="tab" aria-selected={activeCategory === category} className={activeCategory === category ? "selected" : ""} onClick={() => { triggerHaptic("selection"); setActiveCategory(category); }}>
                <span>{categoryLabels[category]}</span>
                {selectedCountByCategory[category] > 0 && <em>{selectedCountByCategory[category]}</em>}
              </button>
            ))}
          </div>}
        <div className="ingredient-group" role="tabpanel">
          {visibleIngredients.length ? <div className="ingredient-option-grid">
            {visibleIngredients.map((ingredient) => (
              <button
                key={ingredient.id}
                className={`ingredient-option ${selected.includes(ingredient.id) ? "selected" : ""}`}
                aria-pressed={selected.includes(ingredient.id)}
                onClick={() => toggleIngredient(ingredient.id)}
              >
                <span>{ingredient.name}</span>
                <i aria-hidden="true">{selected.includes(ingredient.id) && <Check strokeWidth={2} />}</i>
              </button>
            ))}
          </div> : <div className="ingredient-empty-result"><strong>没有找到这个材料</strong><span>换个名称试试，或者按类别浏览。</span></div>}
        </div>
      </div>

      <div className="secondary-action-dock">
        <span>{isManageMode ? (selected.length ? `将保存 ${selected.length} 种材料` : "清空酒柜后也可以保存") : freeText.trim() ? "会一起理解你写下的材料" : `根据 ${selected.length} 种材料匹配`}</span>
        <button className="primary-action" onClick={() => { triggerHaptic("action"); onComplete(selected, freeText, taste); }} disabled={isParsing || (!allowEmpty && !selected.length && !freeText.trim())}>
          {isParsing ? "正在保存" : isManageMode ? `保存 ${selected.length} 种材料` : saveLabel ?? "看看能调什么"}
        </button>
      </div>
    </section>
  );
}
