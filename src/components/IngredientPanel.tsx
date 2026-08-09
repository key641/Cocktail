import { useMemo, useState } from "react";
import { ingredients } from "../data/ingredients";
import type { IngredientCategory, TasteProfile } from "../domain/types";
import { SecondaryHeader } from "./SecondaryHeader";
import { triggerHaptic } from "../utils/haptics";

type IngredientPanelProps = {
  isParsing: boolean;
  onBack: () => void;
  onComplete: (selected: string[], freeText: string, tasteProfile: TasteProfile) => void;
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

export function IngredientPanel({ isParsing, onBack, onComplete }: IngredientPanelProps) {
  const [selected, setSelected] = useState<string[]>(["gin", "lemon-juice", "simple-syrup"]);
  const [freeText, setFreeText] = useState("");
  const [taste, setTaste] = useState<TasteProfile>(defaultTaste);
  const [activeCategory, setActiveCategory] = useState<IngredientCategory>("spirit");

  const grouped = useMemo(() => {
    return ingredients.reduce<Record<string, typeof ingredients>>((groups, ingredient) => {
      groups[ingredient.category] = groups[ingredient.category] ?? [];
      groups[ingredient.category].push(ingredient);
      return groups;
    }, {});
  }, []);
  const selectedIngredients = ingredients.filter((ingredient) => selected.includes(ingredient.id));
  const activeIngredients = grouped[activeCategory] ?? [];

  function toggleIngredient(id: string) {
    triggerHaptic("selection");
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function updateTaste(key: keyof TasteProfile, value: number) {
    setTaste((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="screen preference-screen ingredient-screen">
      <SecondaryHeader
        title="看看手边能调什么"
        description="写一句话，或按类别补充材料"
        progress={`已选 ${selected.length} 种`}
        backLabel="返回首页"
        onBack={onBack}
      />

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

      <div className="selected-ingredient-strip" aria-live="polite">
        <div><strong>已放上吧台</strong><span>{selected.length ? "点一下可移除" : "还没有选择材料"}</span></div>
        <div className="chip-row wrap">
          {selectedIngredients.map((ingredient) => (
            <button key={ingredient.id} className="chip selected removable" onClick={() => toggleIngredient(ingredient.id)} aria-label={`移除${ingredient.name}`}>
              {ingredient.name}<span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      </div>

      <div className="taste-sliders">
        {tasteLabels.map(([key, label]) => (
          <label key={key}>
            <span>{label}</span>
            <input aria-label={`${label}偏好`} type="range" min="0" max="5" value={taste[key]} onChange={(event) => updateTaste(key, Number(event.target.value))} onPointerUp={() => triggerHaptic("selection")} />
          </label>
        ))}
      </div>

      <div className="ingredient-picker">
        <div className="option-group-head"><strong>按类别补充</strong><span>一次只看一组，更容易找</span></div>
        <div className="ingredient-category-tabs" role="tablist" aria-label="材料类别">
          {categoryOrder.map((category) => (
            <button key={category} role="tab" aria-selected={activeCategory === category} className={activeCategory === category ? "selected" : ""} onClick={() => { triggerHaptic("selection"); setActiveCategory(category); }}>
              {categoryLabels[category]}
            </button>
          ))}
        </div>
        <div className="ingredient-group" role="tabpanel">
          <div className="chip-row wrap">
            {activeIngredients.map((ingredient) => (
              <button
                key={ingredient.id}
                className={selected.includes(ingredient.id) ? "chip selected" : "chip"}
                aria-pressed={selected.includes(ingredient.id)}
                onClick={() => toggleIngredient(ingredient.id)}
              >
                {ingredient.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="secondary-action-dock">
        <span>{freeText.trim() ? "会一起理解你写下的材料" : `根据 ${selected.length} 种材料匹配`}</span>
        <button className="primary-action" onClick={() => { triggerHaptic("action"); onComplete(selected, freeText, taste); }} disabled={isParsing || (!selected.length && !freeText.trim())}>
          {isParsing ? "正在识别材料" : "看看能调什么"}
        </button>
      </div>
    </section>
  );
}
