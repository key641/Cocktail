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
};

function createChecks(): CheckItem[] {
  return [
    { label: "后端可达", status: "pending", detail: "" },
    { label: "Agent 状态", status: "pending", detail: "" },
    { label: "LLM 连通", status: "pending", detail: "" },
  ];
}

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
    // If backend is unreachable, skip remaining checks
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
      `API风格: ${data.apiStyle}`,
      `baseUrl: ${data.baseUrlType}`,
      data.hasFallback ? `备用: ${data.fallbackModel}` : "无备用",
    ].join(" | ");
  } catch (e) {
    checks[1].status = "fail";
    checks[1].detail = e instanceof Error ? e.message : "状态查询失败";
  }

  // Check 3: LLM connectivity (simple test)
  checks[2].status = "checking";
  try {
    const res = await fetch(`${apiBase}/api/openai-test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "ping" }),
    });
    const data = await res.json();
    checks[2].status = data.ok ? "ok" : "fail";
    checks[2].detail = data.ok
      ? `响应: ${data.reply?.slice(0, 60) ?? ""}`
      : (data.error ?? "未知错误");
  } catch (e) {
    checks[2].status = "fail";
    checks[2].detail = e instanceof Error ? e.message : "LLM 测试失败";
  }

  const overall =
    checks.every((c) => c.status === "ok") ? "ok"
    : checks.some((c) => c.status === "ok") ? "degraded"
    : "fail";

  return { overall, checks, timestamp: Date.now() };
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
      {/* Trigger icon - top right corner */}
      <button
        className="connection-status-trigger"
        onClick={handleCheck}
        aria-label="测试连接"
        title="测试后端连接"
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
              <button onClick={() => setOpen(false)}>{"\u2715"}</button>
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