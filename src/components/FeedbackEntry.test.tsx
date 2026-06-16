import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FeedbackEntry } from "./FeedbackEntry";

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
});
