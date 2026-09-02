import { describe, expect, it } from "vitest";
import { beginChatTurn } from "./App";
import type { ChatMessage } from "./components/ChatPanel";

describe("beginChatTurn", () => {
  it("adds a pending AI bubble immediately for the second conversation turn", () => {
    const existing: ChatMessage[] = [
      { id: "user-1", role: "user", text: "第一轮" },
      { id: "ai-1", role: "ai", text: "第一轮回复", isPending: false }
    ];

    const messages = beginChatTurn(existing, "user-2", "ai-2", "第二轮");

    expect(messages.at(-2)).toMatchObject({ id: "user-2", role: "user", text: "第二轮" });
    expect(messages.at(-1)).toMatchObject({ id: "ai-2", role: "ai", text: "", isPending: true });
  });

  it("removes a stale unfinished AI bubble before starting the next turn", () => {
    const existing: ChatMessage[] = [
      { id: "user-1", role: "user", text: "第一轮" },
      { id: "ghost", role: "ai", text: "", isPending: true }
    ];

    const messages = beginChatTurn(existing, "user-2", "ai-2", "第二轮");

    expect(messages.some((message) => message.id === "ghost")).toBe(false);
    expect(messages.at(-1)?.id).toBe("ai-2");
  });
});
