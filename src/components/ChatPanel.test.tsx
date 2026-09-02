import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChatPanel, type ChatMessage } from "./ChatPanel";

describe("ChatPanel", () => {
  it("renders the current pending bubble when earlier AI replies already exist", () => {
    const messages: ChatMessage[] = [
      { id: "user-1", role: "user", text: "第一轮" },
      { id: "ai-1", role: "ai", text: "第一轮回复", isPending: false },
      { id: "user-2", role: "user", text: "第二轮" },
      { id: "ai-2", role: "ai", text: "", thinkingSteps: [], isPending: true }
    ];

    const markup = renderToStaticMarkup(
      <ChatPanel
        messages={messages}
        isThinking
        onBack={() => undefined}
        onSubmit={() => undefined}
        onSelectRecommendation={() => undefined}
      />
    );

    expect(markup).toContain("AI 正在思考中...");
    expect(markup).toContain('data-message-id="ai-2"');
    expect(markup).toContain('data-pending="true"');
  });
});
