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
const FEEDBACK_TOPICS = [
  { id: "wrong_recommendation", label: "推荐不准", helper: "口味、场景或强度没对上" },
  { id: "recipe_issue", label: "酒单有误", helper: "配方、材料、步骤或官方口径" },
  { id: "hard_to_use", label: "不好操作", helper: "入口、流程、按钮或文案卡住了" },
  { id: "visual_issue", label: "视觉别扭", helper: "排版、图标、SVG 或动效不舒服" },
  { id: "new_idea", label: "想加内容", helper: "新酒、知识点或玩法建议" }
] as const;
const PRAISE_TOPICS = [
  { id: "good_recommendation", label: "推荐很准", helper: "口味、场景或理由刚好对上" },
  { id: "recipe_helpful", label: "酒单有用", helper: "配方、材料或步骤讲清楚了" },
  { id: "easy_to_use", label: "操作顺手", helper: "入口、流程或文案很自然" },
  { id: "visual_nice", label: "视觉舒服", helper: "卡片、图标、SVG 或动效喜欢" },
  { id: "worth_keeping", label: "想继续用", helper: "这个方向值得保留或加强" }
] as const;
export const FRIEND_PRESSURE_PROMPT = "你认识 641 吗？认识的话请狠狠反馈，压力她。";

type FeedbackTopic = (typeof FEEDBACK_TOPICS)[number]["id"] | (typeof PRAISE_TOPICS)[number]["id"];
type FeedbackTopicItem = { id: FeedbackTopic; label: string; helper: string };

export function getFeedbackTopicsForTone(tone: FeedbackTone | null): readonly FeedbackTopicItem[] {
  return tone === "like" ? PRAISE_TOPICS : FEEDBACK_TOPICS;
}

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
  const [topics, setTopics] = useState<FeedbackTopic[]>([]);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [delivery, setDelivery] = useState<"server" | "local" | null>(null);

  async function submit(nextTone = tone, nextTopics = topics) {
    if (!nextTone) return;

    const feedback: StoredFeedback = {
      id: createFeedbackId(),
      context,
      messageId,
      tone: nextTone,
      relationship: relationship ?? undefined,
      text: formatFeedbackText(nextTopics, text),
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
      setTopics([]);
      setText("");
      void submit(nextTone, []);
      return;
    }

    setOpen(true);
  }

  function openGlobalFeedback() {
    setTone("general");
    setTopics([]);
    setText("");
    setOpen(true);
    setSubmitted(false);
  }

  function selectPanelTone(nextTone: FeedbackTone) {
    setTone(nextTone);
    setTopics([]);
    setRelationship(null);
    setSubmitted(false);
  }

  function toggleTopic(topic: FeedbackTopic) {
    setTopics((current) => current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]);
  }

  const isDislike = tone === "dislike";
  const isPraise = tone === "like";
  const visibleTopics = getFeedbackTopicsForTone(tone);
  const title = context === "global" ? "问题反馈" : "这次推荐有帮到你吗？";
  const panelTitle = isPraise ? "哪里值得继续保留？" : isDislike ? "这条推荐哪里翻车了？" : title;
  const subtitle = isPraise
    ? "收到夸夸也很有用，告诉我哪里值得保留。"
    : isDislike
      ? "选一下哪里不对，我会更快看懂。"
      : "告诉我你想反馈哪一类，能一句话说清也行。";
  const placeholder = isPraise
    ? "比如：推荐很懂我、酒卡信息清楚、SVG 很有感觉、这个流程想保留……"
    : isDislike
      ? "比如：这杯太甜了、材料不对、推荐理由牵强、卡片信息看不懂……"
      : "比如：想增加某杯酒、某个 SVG 怪怪的、推荐流程太绕、酒单信息需要核对……";

  return (
    <div className={`feedback-entry ${compact ? "compact" : "floating"} ${open ? "open" : ""}`}>
      {!open && context === "global" && (
        <button className="feedback-floating-button" type="button" onClick={openGlobalFeedback}>
          <span className="feedback-dot" aria-hidden="true" />
          反馈
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
            <div>
              <span>FEEDBACK</span>
              <strong>{panelTitle}</strong>
            </div>
            <button type="button" aria-label="关闭反馈" onClick={() => setOpen(false)}>×</button>
          </div>
          <p className="feedback-subtitle">{subtitle}</p>

          <div className="feedback-tone-tabs" aria-label="反馈语气">
            <button className={tone === "general" ? "selected" : ""} type="button" onClick={() => selectPanelTone("general")}>
              提问题
            </button>
            <button className={tone === "like" ? "selected" : ""} type="button" onClick={() => selectPanelTone("like")}>
              想夸一下
            </button>
            <button className={tone === "dislike" ? "selected" : ""} type="button" onClick={() => selectPanelTone("dislike")}>
              想吐槽
            </button>
          </div>

          {isDislike && (
            <div className="feedback-probe">
              <p>{FRIEND_PRESSURE_PROMPT}</p>
              <div className="feedback-choice-row">
                <button className={relationship === "knows_me" ? "selected" : ""} type="button" onClick={() => setRelationship("knows_me")}>
                  认识 641，狠狠说
                </button>
                <button className={relationship === "not_yet" ? "selected" : ""} type="button" onClick={() => setRelationship("not_yet")}>
                  不认识，也能说
                </button>
                <button className={relationship === "prefer_not" ? "selected" : ""} type="button" onClick={() => setRelationship("prefer_not")}>
                  先不说
                </button>
              </div>
            </div>
          )}

          <div className="feedback-topic-grid" aria-label="反馈类型">
            {visibleTopics.map((topic) => (
              <button
                className={topics.includes(topic.id) ? "selected" : ""}
                key={topic.id}
                type="button"
                onClick={() => toggleTopic(topic.id)}
              >
                <strong>{topic.label}</strong>
                <small>{topic.helper}</small>
              </button>
            ))}
          </div>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={placeholder}
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

function formatFeedbackText(topics: FeedbackTopic[], text: string) {
  const selectedLabels = [...FEEDBACK_TOPICS, ...PRAISE_TOPICS]
    .filter((topic) => topics.includes(topic.id))
    .map((topic) => topic.label);
  const body = text.trim();

  if (selectedLabels.length === 0) {
    return body;
  }

  return `反馈类型：${selectedLabels.join("、")}${body ? `\n具体反馈：${body}` : ""}`;
}
