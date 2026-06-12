import { useState } from "react";

type FeedbackTone = "like" | "dislike" | "general";
type Relationship = "knows_me" | "not_yet" | "prefer_not";

type FeedbackEntryProps = {
  context: "ai_reply" | "global";
  messageId?: string;
  compact?: boolean;
};

type StoredFeedback = {
  id: string;
  context: FeedbackEntryProps["context"];
  messageId?: string;
  tone: FeedbackTone;
  relationship?: Relationship;
  text: string;
  pageUrl?: string;
  createdAt: string;
};

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

function saveFeedback(feedback: StoredFeedback) {
  const key = "cocktail-feedback";
  const current = JSON.parse(window.localStorage.getItem(key) ?? "[]") as StoredFeedback[];
  window.localStorage.setItem(key, JSON.stringify([feedback, ...current].slice(0, 50)));
}

function createFeedbackId() {
  return `feedback-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ThumbIcon({ down = false }: { down?: boolean }) {
  return (
    <svg className="feedback-thumb-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M7.2 8.2 10 3.6c.4-.6 1.3-.4 1.4.3l.2 2.6h3.8c1 0 1.7.9 1.5 1.9l-1 5.1c-.2.8-.8 1.3-1.6 1.3H7.2V8.2Z"
        transform={down ? "rotate(180 10 10)" : undefined}
      />
      <path d="M3.2 8.4h3v6.4h-3z" transform={down ? "rotate(180 4.7 11.6)" : undefined} />
    </svg>
  );
}

export function FeedbackEntry({ context, messageId, compact = false }: FeedbackEntryProps) {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<FeedbackTone | null>(null);
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [delivery, setDelivery] = useState<"server" | "local" | null>(null);

  async function submit(nextTone = tone) {
    if (!nextTone) return;

    const feedback: StoredFeedback = {
      id: createFeedbackId(),
      context,
      messageId,
      tone: nextTone,
      relationship: relationship ?? undefined,
      text: text.trim(),
      pageUrl: window.location.href,
      createdAt: new Date().toISOString()
    };

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedback)
      });

      if (!response.ok) {
        throw new Error("Feedback API unavailable");
      }

      setDelivery("server");
      setSubmitted(true);
    } catch {
      saveFeedback(feedback);
      setDelivery("local");
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  function pickTone(nextTone: FeedbackTone) {
    setTone(nextTone);
    setSubmitted(false);

    if (nextTone === "like") {
      void submit(nextTone);
      return;
    }

    setOpen(true);
  }

  const isDislike = tone === "dislike";
  const title = context === "global" ? "反馈入口" : "这次回复有帮助吗？";

  return (
    <div className={`feedback-entry ${compact ? "compact" : "floating"} ${open ? "open" : ""}`}>
      {!open && context === "global" && (
        <button className="feedback-floating-button" type="button" onClick={() => {
          setTone("general");
          setOpen(true);
          setSubmitted(false);
        }}>
          意见
        </button>
      )}

      {!open && context === "ai_reply" && (
        <div className="feedback-inline">
          <span>{title}</span>
          <button type="button" aria-label="点赞" onClick={() => pickTone("like")}>
            <ThumbIcon />
            <span>有用</span>
          </button>
          <button type="button" aria-label="点踩" onClick={() => pickTone("dislike")}>
            <ThumbIcon down />
            <span>不准</span>
          </button>
          {submitted && <em>收到，记下了</em>}
        </div>
      )}

      {open && (
        <div className="feedback-panel">
          <div className="feedback-panel-head">
            <strong>{isDislike ? "这条回复哪里翻车了？" : title}</strong>
            <button type="button" aria-label="关闭反馈" onClick={() => setOpen(false)}>×</button>
          </div>

          {isDislike && (
            <div className="feedback-probe">
              <p>你认不认识我？认识的话别客气，狠狠反馈，我扛得住。</p>
              <div className="feedback-choice-row">
                <button className={relationship === "knows_me" ? "selected" : ""} type="button" onClick={() => setRelationship("knows_me")}>
                  认识，狠狠说
                </button>
                <button className={relationship === "not_yet" ? "selected" : ""} type="button" onClick={() => setRelationship("not_yet")}>
                  不认识，但能说
                </button>
                <button className={relationship === "prefer_not" ? "selected" : ""} type="button" onClick={() => setRelationship("prefer_not")}>
                  先不说
                </button>
              </div>
            </div>
          )}

          {tone === "general" && (
            <div className="feedback-choice-row">
              <button className={tone === "general" ? "selected" : ""} type="button">通用反馈</button>
              <button type="button" onClick={() => setTone("like")}>想夸一下</button>
              <button type="button" onClick={() => setTone("dislike")}>想吐槽</button>
            </div>
          )}

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={isDislike ? "哪里不准、哪里难用、哪杯酒被我讲歪了，都可以写。" : "功能、酒单、视觉、推荐逻辑，哪里想改都可以写。"}
            rows={4}
          />

          <div className="feedback-actions">
            {submitted && <span>{delivery === "server" ? "已送达，谢谢你" : "网络不稳，已先保存到本地"}</span>}
            <button className="primary-action" type="button" disabled={submitting} onClick={() => void submit(tone ?? "general")}>
              {submitting ? "提交中" : "提交反馈"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
