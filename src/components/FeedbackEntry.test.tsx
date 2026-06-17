import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FeedbackEntry, FRIEND_PRESSURE_PROMPT, getFeedbackTopicsForTone } from "./FeedbackEntry";

describe("FeedbackEntry", () => {
  it("renders the global feedback entry", () => {
    const markup = renderToStaticMarkup(<FeedbackEntry context="global" />);

    expect(markup).toContain("反馈");
    expect(markup).toContain("feedback-floating-button");
  });

  it("renders inline thumbs after an AI reply", () => {
    const markup = renderToStaticMarkup(<FeedbackEntry context="ai_reply" messageId="msg-1" compact />);

    expect(markup).toContain("这次推荐有帮到你吗");
    expect(markup).toContain("aria-label=\"点赞\"");
    expect(markup).toContain("aria-label=\"点踩\"");
  });

  it("uses praise topics only for praise feedback", () => {
    const labels = getFeedbackTopicsForTone("like").map((topic) => topic.label);

    expect(labels).toContain("推荐很准");
    expect(labels).toContain("视觉舒服");
    expect(labels).not.toContain("推荐不准");
    expect(labels).not.toContain("视觉别扭");
  });

  it("keeps issue topics for general and dislike feedback", () => {
    const generalLabels = getFeedbackTopicsForTone("general").map((topic) => topic.label);
    const dislikeLabels = getFeedbackTopicsForTone("dislike").map((topic) => topic.label);

    expect(generalLabels).toContain("推荐不准");
    expect(dislikeLabels).toContain("酒单有误");
    expect(dislikeLabels).not.toContain("推荐很准");
  });

  it("keeps the friend-pressure prompt explicit", () => {
    expect(FRIEND_PRESSURE_PROMPT).toContain("你认识 641 吗");
    expect(FRIEND_PRESSURE_PROMPT).toContain("狠狠反馈");
    expect(FRIEND_PRESSURE_PROMPT).toContain("压力她");
  });
});
