import { useState } from "react";
import type { Strength, TasteProfile } from "../domain/types";
import { SecondaryHeader } from "./SecondaryHeader";

export type ExploreChoices = {
  mood: "bright" | "quiet" | "bold";
  strength: Strength;
  tasteProfile: TasteProfile;
  seed: number;
};

type ExplorePanelProps = {
  onBack: () => void;
  onComplete: (choices: ExploreChoices) => void;
};

const moodOptions = [
  { id: "quiet", label: "放松", hint: "清爽、松弛、不抢戏" },
  { id: "bright", label: "约会", hint: "明亮、酸甜、有一点仪式感" },
  { id: "bold", label: "聚会", hint: "风味更明确，适合慢慢聊" }
] as const;

const tasteOptions = [
  { id: "fresh", label: "清爽", profile: {fresh: 5, sour: 3, fruity: 2, herbal: 2, sweet: 1, bitter: 1, strong: 1, bubbly: 2 } },
  { id: "sour", label: "酸甜", profile: {fresh: 4, sour: 5, fruity: 1, herbal: 1, sweet: 2, bitter: 1, strong: 2, bubbly: 0 } },
  { id: "fruity", label: "果味", profile: {fresh: 3, sour: 2, fruity: 5, herbal: 1, sweet: 4, bitter: 0, strong: 1, bubbly: 0 } },
  { id: "bitter", label: "微苦", profile: {fresh: 1, sour: 0, fruity: 1, herbal: 4, sweet: 2, bitter: 5, strong: 4, bubbly: 0 } }
] as const;

export function ExplorePanel({ onBack, onComplete }: ExplorePanelProps) {
  const [mood, setMood] = useState<ExploreChoices["mood"]>("quiet");
  const [taste, setTaste] = useState<(typeof tasteOptions)[number]>(tasteOptions[0]);
  const [strength, setStrength] = useState<Strength>("light");
  const activeMood = moodOptions.find((option) => option.id === mood) ?? moodOptions[0];
  const strengthLabel = strength === "light" ? "轻盈" : strength === "medium" ? "适中" : "偏烈";

  return (
    <section className="screen preference-screen explore-screen">
      <SecondaryHeader
        title="今晚想调什么？"
        description="三个选择，帮酒保快速理解你"
        progress="3 项偏好"
        backLabel="返回首页"
        onBack={onBack}
      />

      <div className="preference-summary" aria-live="polite">
        <span>当前选择</span>
        <strong>{taste.label} · {activeMood.label} · {strengthLabel}</strong>
      </div>

      <div className="option-group">
        <div className="option-group-head"><strong>口味偏好</strong><span>先定下主调</span></div>
        <div className="choice-grid taste-choice-grid">
          {tasteOptions.map((option) => (
            <button key={option.id} className={taste.id === option.id ? "choice selected" : "choice"} aria-pressed={taste.id === option.id} onClick={() => setTaste(option)}>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="option-group">
        <div className="option-group-head"><strong>场景 / 心情</strong><span>酒会跟着氛围变化</span></div>
        <div className="choice-grid mood-choice-grid">
          {moodOptions.map((option) => (
            <button
              key={option.id}
              className={mood === option.id ? "choice selected" : "choice"}
              aria-pressed={mood === option.id}
              onClick={() => setMood(option.id)}
            >
              <strong>{option.label}</strong>
              <span>{option.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="option-group">
        <div className="option-group-head"><strong>酒精强度</strong><span>控制今晚的节奏</span></div>
        <div className="segmented">
          {(["light", "medium", "strong"] as Strength[]).map((item) => (
            <button key={item} className={strength === item ? "selected" : ""} aria-pressed={strength === item} onClick={() => setStrength(item)}>
              {item === "light" ? "轻盈" : item === "medium" ? "适中" : "偏烈"}
            </button>
          ))}
        </div>
      </div>

      <div className="secondary-action-dock">
        <button
          className="primary-action"
          onClick={() => onComplete({ mood, strength, tasteProfile: taste.profile, seed: Math.floor(Math.random() * 9999) })}
        >
          看看酒保选的这一杯
        </button>
      </div>
    </section>
  );
}
