import { useState } from "react";
import { ListeningGlass } from "./ListeningGlass";
import { triggerHaptic } from "../utils/haptics";

type HomeProps = {
  onChat: () => void;
  onExplore: () => void;
  onIngredients: () => void;
};

function HomeActionIcon({ type }: { type: "explore" | "ingredients" }) {
  return (
    <svg className="home-action-svg" viewBox="0 0 36 36" aria-hidden="true">
      {type === "explore" ? (
        <>
          <path d="M18 7.5 C22.8 12.4 25.2 16.6 25.2 20.1 C25.2 24 22.1 27 18 27 C13.9 27 10.8 24 10.8 20.1 C10.8 16.6 13.2 12.4 18 7.5 Z" />
          <path d="M14.2 19.5 C16.1 21.2 19.8 21.3 21.8 19.6" />
          <path d="M18 10.5 C19.4 13.5 19.9 16 19.4 18" />
        </>
      ) : (
        <>
          <path d="M12.5 9.2 C15.4 8 19.3 9.8 20.2 13.1 C17.1 14.2 13.8 13 12.5 9.2 Z" />
          <path d="M22.8 12.2 C26 12.8 28 16.1 26.7 19.2 C23.5 18.9 21.2 16.1 22.8 12.2 Z" />
          <path d="M18.5 14.5 C17.6 18.5 16.2 22 13.7 25.5" />
          <path d="M19.3 16.5 C21.5 19.1 23.2 22 24.3 25.5" />
        </>
      )}
    </svg>
  );
}

export function Home({ onChat, onExplore, onIngredients }: HomeProps) {
  const [glassState, setGlassState] = useState<"idle" | "listening">("idle");

  function open(action: () => void) {
    triggerHaptic("action");
    action();
  }

  return (
    <section className="screen home-screen">
      <div className="home-hero-copy">
        <p className="home-greeting">晚上好，我在。</p>
        <h1>今晚想喝点<br />什么？</h1>
        <p>告诉我你的心情、口味，或者手边有什么。<br />我来替你把选择变简单。</p>
      </div>

      <div className="glass-stage">
        <button
          className="glass-entry"
          onClick={() => open(onChat)}
          onMouseEnter={() => setGlassState("listening")}
          onMouseLeave={() => setGlassState("idle")}
          onFocus={() => setGlassState("listening")}
          onBlur={() => setGlassState("idle")}
          aria-label="和 AI 调酒师聊聊"
        >
          <ListeningGlass state={glassState} liquidTone="citrus" />
        </button>
        <div className="bartender-note">
          <span>你的私人酒保</span>
          <p>点一下，告诉我今晚的状态</p>
        </div>
      </div>

      <div className="action-stack home-actions">
        <button className="home-action-card home-action-primary" onClick={() => open(onChat)}>
          <span className="home-action-index">AI 酒保</span>
          <span>
            <strong>和酒保聊聊</strong>
            <small>一句话说出你现在想喝的感觉</small>
          </span>
          <span className="home-action-arrow" aria-hidden="true">→</span>
        </button>
        <button className="home-action-card" onClick={() => open(onExplore)}>
          <span className="home-action-icon"><HomeActionIcon type="explore" /></span>
          <span>
            <strong>慢慢探索</strong>
            <small>从口味、心情和场合开始</small>
          </span>
        </button>
        <button className="home-action-card" onClick={() => open(onIngredients)}>
          <span className="home-action-icon"><HomeActionIcon type="ingredients" /></span>
          <span>
            <strong>看看手边材料</strong>
            <small>把已有的酒和辅料变成一杯</small>
          </span>
        </button>
      </div>
    </section>
  );
}
