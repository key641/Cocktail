import { useState, useRef, useEffect } from "react";
import { CocktailVisual } from "./CocktailVisual";
import { FeedbackEntry } from "./FeedbackEntry";
import { ListeningGlass } from "./ListeningGlass";
import { useTypewriter } from "../hooks/useTypewriter";
import { getCocktailVisualSpec } from "../data/cocktailVisuals";
import type { AgentDrinkCandidate, AgentRecommendationBundle } from "../domain/agentTypes";
import { SecondaryHeader } from "./SecondaryHeader";
import { triggerHaptic } from "../utils/haptics";

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
  clarification?: { question: string; options: string[] };
  typingSpeed?: number;
  isPending?: boolean;
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

function ThinkingInline({ steps, live, minimal }: { steps: ThinkingStep[]; live?: boolean; minimal?: boolean }) {
  const [open, setOpen] = useState(false);

  // Auto-collapse when switching to minimal (done) mode
  useEffect(() => {
    if (minimal) setOpen(false);
  }, [minimal]);

  if (!steps.length) return null;

  // In minimal (done) mode, show a compact one-liner that expands on click
  if (minimal) {
    return (
      <div className="thinking-inline thinking-done">
        <button
          className="thinking-toggle"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <span className="thinking-dot done" />
          <span>思考已完成 ({steps.length} 步)</span>
          <span className={`thinking-chevron ${open ? "open" : ""}`}>▼</span>
        </button>
        {open && (
          <div className="thinking-steps">
            {steps.map((entry, i) => (
              <div key={i} className={`thinking-step ${entry.step.includes("兜底") ? "fallback" : ""}`}>
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

  // Live mode: pulsing dot + expandable steps
  return (
    <div className="thinking-inline">
      <button
        className="thinking-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="thinking-dot live" />
        <span>AI 正在思考 ({steps.length} 步)</span>
        <span className={`thinking-chevron ${open ? "open" : ""}`}>▼</span>
      </button>
      {open && (
        <div className="thinking-steps">
          {steps.map((entry, i) => (
            <div key={i} className="thinking-step latest">
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
  onSelect
}: {
  candidate: AgentDrinkCandidate;
  isPrimary: boolean;
  onSelect: () => void;
}) {
  const visualSpec = candidate.recipeMode === "local" ? getCocktailVisualSpec(candidate.id) : undefined;
  const ingredients = candidate.recipe?.ingredients ?? [];
  const ingredientNames = ingredients.map((ing) => ing.name).join("、");

  return (
    <button
      className={`chat-recommendation-card ${isPrimary ? "primary" : ""}`}
      onClick={() => { triggerHaptic("selection"); onSelect(); }}
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
        <p className="chat-rec-ingredients">{ingredientNames || "暂无原料信息"}</p>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  AI Message Bubble (with typewriter + inline thinking)              */
/* ------------------------------------------------------------------ */

function AiBubble({
  message,
  onSelectRecommendation,
  onPickOption,
  optionsDisabled
}: {
  message: ChatMessage;
  onSelectRecommendation: (index: number) => void;
  onPickOption: (text: string) => void;
  optionsDisabled: boolean;
}) {
  const hasSteps = message.thinkingSteps && message.thinkingSteps.length > 0;
  const isPendingOnly = message.isPending && !message.text && !message.recommendation;

  const speed = message.typingSpeed ?? 30;
  const { displayed, isTyping } = useTypewriter(message.text, speed, !isPendingOnly);
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
        {hasSteps && (
          <ThinkingInline steps={message.thinkingSteps!} live={isPendingOnly} minimal={!isPendingOnly} />
        )}

        {isPendingOnly && !hasSteps && (
          <div className="chat-bubble ai-bubble thinking-bubble">
            <span className="thinking-dot live" />
            <span>AI 正在思考中...</span>
          </div>
        )}

        {!isPendingOnly && text && (
          <>
            <div className="chat-bubble ai-bubble">
              <p className={isTyping ? "typing-cursor" : ""}>
                {text}
                {isTyping && <span className="cursor-blink">|</span>}
              </p>
            </div>
          </>
        )}

        {message.safetyMessage && (
          <div className="soft-warning">{message.safetyMessage}</div>
        )}

        {!isPendingOnly && !isTyping && message.clarification && message.clarification.options.length > 0 && (
          <div className="chat-bubble examples-bar clarification-options">
            <strong>快捷回复</strong>
            <div className="chat-examples">
              {message.clarification.options.map((option) => (
                <button key={option} onClick={() => onPickOption(option)} disabled={optionsDisabled}>
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="chat-recommendations">
            <div className="chat-rec-head">
              <strong>我会先看这三杯</strong>
            </div>
            {recommendations.map((candidate, index) => (
              <RecommendationMiniCard
                key={candidate.id}
                candidate={candidate}
                isPrimary={index === 0}
                onSelect={() => onSelectRecommendation(index)}
              />
            ))}
          </div>
        )}

        {!isPendingOnly && !isTyping && text && <FeedbackEntry context="ai_reply" messageId={message.id} compact />}
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
  "你能帮我怎么选酒？",
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
          <button key={example} onClick={() => { triggerHaptic("selection"); onPick(example); }} disabled={disabled}>
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
    triggerHaptic("action");
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
      <SecondaryHeader
        compact
        title="AI 调酒师"
        description="说说口味、心情或手边材料"
        backLabel="返回首页"
        onBack={onBack}
      />

      <div className="chat-messages-area">
        {!hasMessages && !isThinking && (
          <>
            <div className="chat-companion">
              <ListeningGlass state="thinking" liquidTone="citrus" />
            </div>
            <ExamplesBar onPick={setText} disabled={isThinking} />
          </>
        )}

        {messages.map((msg) =>
          msg.role === "user" ? (
            <UserBubble key={msg.id} text={msg.text} />
          ) : (
            <AiBubble
              key={msg.id}
              message={msg}
              onSelectRecommendation={onSelectRecommendation}
              onPickOption={onSubmit}
              optionsDisabled={isThinking}
            />
          )
        )}

        {isThinking && !messages.some((m) => m.role === "ai") && (
          <div className="chat-message ai-message">
            <div className="chat-avatar ai-avatar">
              <ListeningGlass state="thinking" liquidTone="citrus" />
            </div>
            <div className="chat-bubble ai-bubble thinking-bubble">
              <span className="thinking-dot live" />
              <span>AI 正在思考中...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-card">
        <textarea
          aria-label="告诉酒保你想喝什么"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="例如：我想喝清爽、酸一点、带气泡感，适合夏天"
          rows={1}
        />
        <button
          className="primary-action chat-send-button"
          onClick={submit}
          disabled={isThinking || !text.trim()}
          aria-label={isThinking ? "正在理解你的口味" : "发送"}
          title={isThinking ? "正在理解你的口味" : "发送"}
        >
          {isThinking ? (
            <span className="chat-send-spinner" aria-hidden="true" />
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h13" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          )}
        </button>
      </div>
    </section>
  );
}
