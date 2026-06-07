import { useMemo, useState } from "react";
import { ingredients } from "../data/ingredients";
import type { IngredientCategory, TasteProfile } from "../domain/types";

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

export function IngredientPanel({ isParsing, onBack, onComplete }: IngredientPanelProps) {
  const [selected, setSelected] = useState<string[]>(["gin", "lemon-juice", "simple-syrup"]);
  const [freeText, setFreeText] = useState("");
  const [taste, setTaste] = useState<TasteProfile>(defaultTaste);

  const grouped = useMemo(() => {
    return ingredients.reduce<Record<string, typeof ingredients>>((groups, ingredient) => {
      groups[ingredient.category] = groups[ingredient.category] ?? [];
      groups[ingredient.category].push(ingredient);
      return groups;
    }, {});
  }, []);

  function toggleIngredient(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function updateTaste(key: keyof TasteProfile, value: number) {
    setTaste((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="screen preference-screen">
      <button className="ghost-button icon-back" onClick={onBack}>←</button>
      <div className="section-heading centered">
        <h2>用手边材料调酒</h2>
        <p>点选已有材料，或者直接写一句话</p>
      </div>

      <textarea
        className="ingredient-textarea"
        value={freeText}
        onChange={(event) => setFreeText(event.target.value)}
        placeholder="例如：我有龙舌兰、青柠、汤力水，还有一点薄荷"
      />

      <div className="taste-sliders">
        {tasteLabels.map(([key, label]) => (
          <label key={key}>
            <span>{label}</span>
            <input type="range" min="0" max="5" value={taste[key]} onChange={(event) => updateTaste(key, Number(event.target.value))} />
          </label>
        ))}
      </div>

      <div className="ingredient-groups">
        {Object.entries(grouped).map(([category, group]) => (
          <div key={category} className="ingredient-group">
            <span className="group-label">{categoryLabels[category as IngredientCategory]}</span>
            <div className="chip-row wrap">
              {group.map((ingredient) => (
                <button
                  key={ingredient.id}
                  className={selected.includes(ingredient.id) ? "chip selected" : "chip"}
                  onClick={() => toggleIngredient(ingredient.id)}
                >
                  {ingredient.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button className="primary-action bottom-action" onClick={() => onComplete(selected, freeText, taste)} disabled={isParsing}>
        {isParsing ? "正在识别材料" : "为我推荐"}
      </button>
    </section>
  );
}
