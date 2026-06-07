import { useState, useRef, useEffect } from "react";
import { CocktailVisual } from "./CocktailVisual";
import { ListeningGlass } from "./ListeningGlass";
import { useTypewriter } from "../hooks/useTypewriter";
import { getCocktailVisualSpec } from "../data/cocktailVisuals";
import type { AgentDrinkCandidate, AgentRecommendationBundle } from "../domain/agentTypes";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ThinkingStep = {
  step: string;
  detail: string;
  data?: unknown;
};

export type ChatMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
  thinkingSteps?: ThinkingStep[];
  recommendation?: AgentRecommendationBundle;
  safetyMessage?: string;
  typingSpeed?: number;
};

type ChatPanelProps = {
  messages: ChatMessage[];
  isThinking: boolean;
  onBack: () => void;
  onSubmit: (text: string) => void;
  onSelectRecommendation: (index: number) => void;
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ThinkingInline({ steps }: { steps: ThinkingStep[] }) {
  const [open, setOpen] = useState(true);

  if (!steps.length) return null;

  return (
    <div className="thinking-inline">
      <button
        className="thinking-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="thinking-dot" />
        <span>AI 正在思考 ({steps.length} 步)</span>
        <span className={`thinking-chevron ${open ? "open" : ""}`}>▼</span>
      </button>
      {open && (
        <div className="thinking-steps">
          {steps.map((entry, i) => (
            <div key={i} className="thinking-step">
              <span className="thinking-step-num">{i + 1}</span>
              <div>
                <strong>{entry.step}</strong>
                <p>{entry.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendationMiniCard({
  candidate,
  isPrimary,
  reason,
  onSelect
}: {
  candidate: AgentDrinkCandidate;
  isPrimary: boolean;
  reason?: string;
  onSelect: () => void;
}) {
  const visualSpec = candidate.recipeMode === "local" ? getCocktailVisualSpec(candidate.id) : undefined;
  const displayReason = reason || candidate.reason;

  return (
    <button
      className={`chat-recommendation-card ${isPrimary ? "primary" : ""}`}
      onClick={onSelect}
    >
      <div className="chat-rec-visual">
        {visualSpec ? (
          <CocktailVisual spec={visualSpec} title={candidate.englishName || candidate.name} />
        ) : (
          <div className="external-visual-placeholder compact">
            <strong>{candidate.name.slice(0, 1)}</strong>
          </div>
        )}
      </div>
      <div className="chat-rec-copy">
        <div>
          {isPrimary && <span className="best-badge">最佳推荐</span>}
          <h3>{candidate.englishName || candidate.name}</h3>
          {candidate.englishName && (
            <p className="chat-rec-name">{candidate.name}</p>
          )}
        </div>
        <div className="tag-row compact">
          {candidate.tags.slice(0, 2).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <p className="chat-rec-reason">{displayReason}</p>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  AI Message Bubble (with typewriter + inline thinking)              */
/* ------------------------------------------------------------------ */

function AiBubble({
  message,
  onSelectRecommendation
}: {
  message: ChatMessage;
  onSelectRecommendation: (index: number) => void;
}) {
  const speed = message.typingSpeed ?? 30;
  const { displayed, isTyping } = useTypewriter(message.text, speed, true);
  const text = displayed || message.text;

  const recommendations = message.recommendation
    ? [message.recommendation.primary, ...message.recommendation.alternatives].slice(0, 3)
    : [];

  return (
    <div className="chat-message ai-message">
      <div className="chat-avatar ai-avatar">
        <ListeningGlass state="thinking" liquidTone="citrus" />
      </div>
      <div className="chat-bubble-content">
        {message.thinkingSteps && message.thinkingSteps.length > 0 && (
          <ThinkingInline steps={message.thinkingSteps} />
        )}

        <div className="chat-bubble ai-bubble">
          <p className={isTyping ? "typing-cursor" : ""}>
            {text}
            {isTyping && <span className="cursor-blink">|</span>}
          </p>
        </div>

        {message.safetyMessage && (
          <div className="soft-warning">{message.safetyMessage}</div>
        )}

        {recommendations.length > 0 && (
          <div className="chat-recommendations">
            <div className="chat-rec-head">
              <strong>我会先看这三杯</strong>
              <span>第一杯更贴合你刚才的描述</span>
            </div>
            {recommendations.map((candidate, index) => (
              <RecommendationMiniCard
                key={candidate.id}
                candidate={candidate}
                isPrimary={index === 0}
                reason={
                  index === 0
                    ? message.recommendation?.reason
                    : undefined
                }
                onSelect={() => onSelectRecommendation(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  User Message Bubble                                                */
/* ------------------------------------------------------------------ */

function UserBubble({ text }: { text: string }) {
  return (
    <div className="chat-message user-message">
      <div className="chat-bubble user-bubble">
        <p>{text}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Examples picker (shown when no messages yet)                       */
/* ------------------------------------------------------------------ */

const examples = [
  "我想喝清爽一点、酸酸的，有点气泡感，适合夏天",
  "家里有金酒、柠檬和糖浆，可以做什么？",
  "像 Margarita 但没那么烈"
];

function ExamplesBar({ onPick, disabled }: { onPick: (text: string) => void; disabled: boolean }) {
  return (
    <div className="chat-bubble examples-bar">
      <strong>可以这样说</strong>
      <div className="chat-examples">
        {examples.map((example) => (
          <button key={example} onClick={() => onPick(example)} disabled={disabled}>
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main ChatPanel                                                     */
/* ------------------------------------------------------------------ */

export function ChatPanel({
  messages,
  isThinking,
  onBack,
  onSubmit,
  onSelectRecommendation
}: ChatPanelProps) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  function submit() {
    const value = text.trim();
    if (!value || isThinking) return;
    setText("");
    onSubmit(value);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <section className="screen chat-screen">
      <div className="chat-top-bar">
        <button className="ghost-button icon-back" onClick={onBack}>
          ←
        </button>
        <span className="chat-title">AI 调酒师</span>
        <span className="chat-title-spacer" />
      </div>

      <div className="chat-messages-area">
        {!hasMessages && !isThinking && (
          <ExamplesBar onPick={setText} disabled={isThinking} />
        )}

        {messages.map((msg) =>
          msg.role === "user" ? (
            <UserBubble key={msg.id} text={msg.text} />
          ) : (
            <AiBubble
              key={msg.id}
              message={msg}
              onSelectRecommendation={onSelectRecommendation}
            />
          )
        )}

        {isThinking && (
          <div className="chat-message ai-message">
            <div className="chat-avatar ai-avatar">
              <ListeningGlass state="thinking" liquidTone="citrus" />
            </div>
            <div className="chat-bubble ai-bubble thinking-bubble">
              <span className="thinking-dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-card">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="例如：我想喝清爽、酸一点、带气泡感，适合夏天"
          rows={3}
        />
        <button
          className="primary-action"
          onClick={submit}
          disabled={isThinking || !text.trim()}
        >
          {isThinking ? "正在理解你的口味" : "发送"}
        </button>
      </div>
    </section>
  );
}
