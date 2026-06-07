import { useState } from "react";

type CheckItem = {
  label: string;
  status: "pending" | "checking" | "ok" | "fail";
  detail: string;
};

type ConnectionReport = {
  overall: "ok" | "degraded" | "fail";
  checks: CheckItem[];
  timestamp: number;
  llmRequest?: string;
  llmReply?: string;
  llmError?: string;
};

function createChecks(): CheckItem[] {
  return [
    { label: "后端可达", status: "pending", detail: "" },
    { label: "Agent 状态", status: "pending", detail: "" },
    { label: "LLM 测试", status: "pending", detail: "" },
  ];
}

const TEST_MESSAGE = "请用一句话介绍自己，并推荐一杯经典的鸡尾酒。";

async function runConnectionCheck(apiBase: string): Promise<ConnectionReport> {
  const checks = createChecks();

  // Check 1: Backend reachability
  checks[0].status = "checking";
  try {
    const res = await fetch(`${apiBase}/api/agent/status`);
    if (res.ok) {
      checks[0].status = "ok";
      checks[0].detail = "后端服务正常响应";
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (e) {
    checks[0].status = "fail";
    checks[0].detail = e instanceof Error ? e.message : "无法连接";
    return { overall: "fail", checks, timestamp: Date.now() };
  }

  // Check 2: Agent status
  checks[1].status = "checking";
  try {
    const res = await fetch(`${apiBase}/api/agent/status`);
    const data = await res.json();
    checks[1].status = data.hasOpenAIClient ? "ok" : "fail";
    checks[1].detail = [
      `模型: ${data.model}`,
      `API 风格: ${data.apiStyle}`,
      `Base URL: ${data.baseUrlType}`,
      data.hasFallback ? `备用: ${data.fallbackModel}` : "无备用",
    ].join("  |  ");
  } catch (e) {
    checks[1].status = "fail";
    checks[1].detail = e instanceof Error ? e.message : "状态查询失败";
  }

  // Check 3: Real LLM test
  checks[2].status = "checking";
  let llmRequest: string | undefined;
  let llmReply: string | undefined;
  let llmError: string | undefined;

  try {
    const res = await fetch(`${apiBase}/api/openai-test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: TEST_MESSAGE }),
    });
    const data = await res.json();
    checks[2].status = data.ok ? "ok" : "fail";
    llmRequest = data.request ?? TEST_MESSAGE;
    llmReply = data.reply;
    llmError = data.error;
    checks[2].detail = data.ok ? "LLM 响应成功" : (data.error ?? "未知错误");
  } catch (e) {
    checks[2].status = "fail";
    llmError = e instanceof Error ? e.message : "LLM 测试失败";
    checks[2].detail = llmError;
  }

  const overall =
    checks.every((c) => c.status === "ok") ? "ok"
    : checks.some((c) => c.status === "ok") ? "degraded"
    : "fail";

  return { overall, checks, timestamp: Date.now(), llmRequest, llmReply, llmError };
}

function statusIcon(status: CheckItem["status"]) {
  switch (status) {
    case "ok": return "\u2705";
    case "fail": return "\u274C";
    case "checking": return "\u23F3";
    default: return "\u26AA";
  }
}

function overallEmoji(overall: ConnectionReport["overall"]) {
  switch (overall) {
    case "ok": return "\u2705";
    case "degraded": return "\u26A0\uFE0F";
    case "fail": return "\u274C";
  }
}

export default function ConnectionStatus() {
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState<ConnectionReport | null>(null);
  const [loading, setLoading] = useState(false);

  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

  async function handleCheck() {
    setLoading(true);
    setOpen(true);
    setReport(null);
    const result = await runConnectionCheck(apiBase);
    setReport(result);
    setLoading(false);
  }

  return (
    <>
      {/* Trigger icon */}
      <button
        className="connection-status-trigger"
        onClick={handleCheck}
        aria-label="测试连接"
        title="测试后端和 LLM 连接"
      >
        {"\u{1F50C}"}
        {report && (
          <span className={`connection-dot ${report.overall}`} />
        )}
      </button>

      {/* Modal panel */}
      {open && (
        <div className="connection-modal-overlay" onClick={() => setOpen(false)}>
          <div className="connection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="connection-modal-header">
              <h3>{"\u{1F50C} 连接诊断"}</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleCheck}
                  disabled={loading}
                  style={{ fontSize: 14, color: "#b8b0a0" }}
                >
                  {"\u{1F504}"}
                </button>
                <button onClick={() => setOpen(false)}>{"\u2715"}</button>
              </div>
            </div>

            <div className="connection-modal-body">
              {!apiBase && (
                <p className="connection-note">本地开发模式 (Vite 代理)</p>
              )}
              {apiBase && (
                <p className="connection-url">{apiBase}</p>
              )}

              {loading && (
                <div className="connection-loading">
                  <span className="thinking-dot live" />
                  正在检测...
                </div>
              )}

              {report && (
                <>
                  <div className={`connection-overall ${report.overall}`}>
                    {overallEmoji(report.overall)}{" "}
                    {report.overall === "ok" ? "一切正常" : report.overall === "degraded" ? "部分可用" : "连接失败"}
                  </div>

                  <ul className="connection-checks">
                    {report.checks.map((check) => (
                      <li key={check.label} className={`connection-check ${check.status}`}>
                        <span className="check-icon">{statusIcon(check.status)}</span>
                        <div>
                          <strong>{check.label}</strong>
                          {check.detail && <small>{check.detail}</small>}
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* LLM conversation display */}
                  {report.llmRequest && (
                    <div className="llm-chat-bubble user-bubble">
                      <div className="llm-chat-label">{"\u{1F464} 发送"}</div>
                      <p>{report.llmRequest}</p>
                    </div>
                  )}
                  {report.llmReply && (
                    <div className="llm-chat-bubble ai-bubble">
                      <div className="llm-chat-label">{"\u{1F916} LLM 回复"}</div>
                      <p>{report.llmReply}</p>
                    </div>
                  )}
                  {report.llmError && (
                    <div className="llm-chat-bubble error-bubble">
                      <div className="llm-chat-label">{"\u26A0\uFE0F"} 错误</div>
                      <p>{report.llmError}</p>
                    </div>
                  )}

                  <small className="connection-timestamp">
                    {new Date(report.timestamp).toLocaleTimeString()}
                  </small>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}