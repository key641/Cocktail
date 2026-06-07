import { useState } from "react";
import type { Strength, TasteProfile } from "../domain/types";

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

  return (
    <section className="screen preference-screen">
      <button className="ghost-button icon-back" onClick={onBack}>←</button>
      <div className="section-heading centered">
        <h2>今晚想调什么？</h2>
        <p>告诉我们你的偏好，为你推荐合适的酒款</p>
      </div>

      <div className="option-group">
        <span className="group-label">口味偏好</span>
        <div className="choice-grid">
          {tasteOptions.map((option) => (
            <button key={option.id} className={taste.id === option.id ? "choice selected" : "choice"} onClick={() => setTaste(option)}>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="option-group">
        <span className="group-label">场景 / 心情</span>
        <div className="choice-grid">
          {moodOptions.map((option) => (
            <button
              key={option.id}
              className={mood === option.id ? "choice selected" : "choice"}
              onClick={() => setMood(option.id)}
            >
              <strong>{option.label}</strong>
              <span>{option.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="option-group">
        <span className="group-label">酒精强度</span>
        <div className="segmented">
          {(["light", "medium", "strong"] as Strength[]).map((item) => (
            <button key={item} className={strength === item ? "selected" : ""} onClick={() => setStrength(item)}>
              {item === "light" ? "不太甜" : item === "medium" ? "刚刚好" : "浓郁"}
            </button>
          ))}
        </div>
      </div>

      <button
        className="primary-action bottom-action"
        onClick={() => onComplete({ mood, strength, tasteProfile: taste.profile, seed: Math.floor(Math.random() * 9999) })}
      >
        为我推荐
      </button>
    </section>
  );
}
