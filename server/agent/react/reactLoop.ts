import type { OpenAIJsonClient } from "../../ai/openaiClient";
import { parseUserPreference } from "../../../src/domain/preferenceParser";
import { matchCocktailsTool } from "../tools";
import type { AgentFollowUpAction, AgentSessionState, AgentTraceEntry } from "../types";
import { buildReActUserPayload, REACT_SYSTEM_PROMPT, reactStepSchema } from "./prompts";
import { reactToolRegistry, type ReActRunContext } from "./toolRegistry";
import {
  createReActStore,
  knownRefs,
  REACT_TERMINAL_ACTIONS,
  REACT_TOOL_NAMES,
  ReActLoopError,
  ReActToolArgsError,
  type ReActFinalArgs,
  type ReActOutcome,
  type ReActStepDecision,
  type ReActStepRecord,
  type ReActStore,
  type ReActToolName
} from "./types";

export type RunReActLoopInput = {
  text: string;
  client: OpenAIJsonClient;
  session?: AgentSessionState;
  onTrace?: (entry: AgentTraceEntry) => void;
  maxSteps?: number;
  wallClockMs?: number;
};

export type ReActLoopResult = {
  outcome: ReActOutcome;
  store: ReActStore;
  steps: ReActStepRecord[];
};

const TOOL_LABELS: Record<ReActToolName, string> = {
  match_cocktails: "匹配酒款",
  get_cocktail_recipe: "查看配方",
  suggest_classic_twist: "经典改编",
  search_external_recipe: "外部配方搜索",
  search_inspiration: "外部灵感搜索",
  generate_share_caption: "生成分享文案"
};

const FINAL_INTENTS: ReActFinalArgs["intent"][] = [
  "classic_recommendation",
  "ingredient_matching",
  "named_cocktail_lookup",
  "official_recipe_check",
  "classic_twist",
  "external_inspiration",
  "share_caption"
];

const FOLLOW_UP_ACTIONS: AgentFollowUpAction[] = [
  "view_recipe",
  "follow_along",
  "try_another",
  "open_ingredients",
  "safe_mocktail",
  "lower_alcohol",
  "sweeter",
  "verify_recipe"
];

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function parseArguments(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  const parsed = JSON.parse(trimmed);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new ReActToolArgsError("arguments 必须是 JSON 对象字符串");
  }
  return parsed as Record<string, unknown>;
}

function isToolAction(action: string): action is ReActToolName {
  return (REACT_TOOL_NAMES as readonly string[]).includes(action);
}

function isTerminalAction(action: string) {
  return (REACT_TERMINAL_ACTIONS as readonly string[]).includes(action);
}

// 反幻觉守护：final 引用的 ref 必须来自工具观察结果；
// 越界时用本地匹配结果确定性替换。
function guardFinalArgs(args: Record<string, unknown>, ctx: ReActRunContext, text: string): ReActFinalArgs {
  const reason = typeof args.reason === "string" && args.reason.trim() ? args.reason.trim() : undefined;
  const cocktailRef = typeof args.cocktail_ref === "string" && args.cocktail_ref.trim() ? args.cocktail_ref.trim() : undefined;
  if (!reason || !cocktailRef) {
    throw new ReActToolArgsError("final_recommendation 需要 cocktail_ref 和 reason 两个必填参数");
  }

  const refs = knownRefs(ctx.store);
  let resolvedRef = cocktailRef;
  let hallucinatedRef: string | undefined;
  if (!refs.has(cocktailRef)) {
    if (!ctx.store.lastMatch) {
      const preference = parseUserPreference(text);
      const matched = matchCocktailsTool(preference, text);
      ctx.store.lastMatch = {
        preference,
        primary: matched.primaryRecommendation,
        alternatives: matched.alternatives,
        ownedIngredients: matched.ownedIngredients
      };
      ctx.store.localCandidates.set(matched.primaryRecommendation.cocktail.id, matched.primaryRecommendation);
      for (const alternative of matched.alternatives) {
        ctx.store.localCandidates.set(alternative.cocktail.id, alternative);
      }
    }
    hallucinatedRef = cocktailRef;
    resolvedRef = ctx.store.lastMatch.primary.cocktail.id;
  }

  const guardedRefs = knownRefs(ctx.store);
  const alternativeRefs = (Array.isArray(args.alternative_refs) ? args.alternative_refs : [])
    .filter((ref): ref is string => typeof ref === "string" && guardedRefs.has(ref) && ref !== resolvedRef)
    .slice(0, 2);

  const intent = typeof args.intent === "string" && FINAL_INTENTS.includes(args.intent as ReActFinalArgs["intent"])
    ? (args.intent as ReActFinalArgs["intent"])
    : "classic_recommendation";

  const followUp = (Array.isArray(args.follow_up) ? args.follow_up : [])
    .filter((action): action is AgentFollowUpAction => typeof action === "string" && FOLLOW_UP_ACTIONS.includes(action as AgentFollowUpAction));

  return {
    cocktailRef: resolvedRef,
    reason: truncate(reason, 80),
    alternativeRefs,
    intent,
    followUp: followUp.length ? followUp : undefined,
    hallucinatedRef
  };
}

function parseTerminal(decision: ReActStepDecision, ctx: ReActRunContext, text: string): ReActOutcome {
  const args = parseArguments(decision.arguments);
  if (decision.action === "final_recommendation") {
    return { kind: "final_recommendation", args: guardFinalArgs(args, ctx, text) };
  }
  if (decision.action === "ask_clarification") {
    const question = typeof args.question === "string" && args.question.trim() ? args.question.trim() : undefined;
    if (!question) {
      throw new ReActToolArgsError("ask_clarification 需要 question 参数");
    }
    const options = (Array.isArray(args.options) ? args.options : [])
      .filter((option): option is string => typeof option === "string" && option.trim().length > 0)
      .slice(0, 4);
    return { kind: "ask_clarification", args: { question, options } };
  }
  const reply = typeof args.reply === "string" && args.reply.trim() ? args.reply.trim() : undefined;
  if (!reply) {
    throw new ReActToolArgsError("smalltalk_reply 需要 reply 参数");
  }
  return { kind: "smalltalk_reply", args: { reply } };
}

// 步数/时间耗尽时的强制收尾：有匹配结果就用它，没有则抛错交给降级管线。
function forceFinalize(ctx: ReActRunContext, reason: string): ReActOutcome {
  const match = ctx.store.lastMatch;
  if (!match) {
    throw new ReActLoopError(`ReAct 循环${reason}，且没有可用的匹配结果`);
  }
  return {
    kind: "final_recommendation",
    args: {
      cocktailRef: match.primary.cocktail.id,
      reason: truncate(match.primary.reason, 80),
      alternativeRefs: match.alternatives.slice(0, 2).map((item) => item.cocktail.id),
      intent: match.preference.requestType === "ingredient_matching" ? "ingredient_matching" : "classic_recommendation",
      forced: true
    }
  };
}

export async function runReActLoop({
  text,
  client,
  session,
  onTrace,
  maxSteps = 4,
  wallClockMs = 20000
}: RunReActLoopInput): Promise<ReActLoopResult> {
  const store = createReActStore();
  const ctx: ReActRunContext = { client, session, store };
  const steps: ReActStepRecord[] = [];
  const startedAt = Date.now();
  let lastErrorMessage: string | undefined;
  let errorStrikes = 0;

  for (let stepIndex = 0; stepIndex < maxSteps; stepIndex += 1) {
    if (Date.now() - startedAt > wallClockMs) {
      onTrace?.({ step: "ReAct 收尾", detail: "耗时超出预算，用已有结果强制收尾", data: { wallClockMs } });
      return { outcome: forceFinalize(ctx, "耗时超出预算"), store, steps };
    }

    const decision = await client.generateJson<ReActStepDecision>({
      system: REACT_SYSTEM_PROMPT,
      user: buildReActUserPayload({ text, session, steps }),
      schemaName: "react_step",
      schema: reactStepSchema
    });

    if (typeof decision?.action !== "string" || typeof decision?.thought !== "string") {
      throw new ReActLoopError("模型输出不符合 ReAct 决策结构");
    }

    onTrace?.({
      step: `思考（第 ${stepIndex + 1} 步）`,
      detail: truncate(decision.thought, 120),
      data: { action: decision.action }
    });

    // 与上一步完全相同的动作 → 模型在原地打转，强制收尾
    const previous = steps[steps.length - 1];
    if (previous && previous.action === decision.action && previous.arguments === decision.arguments) {
      onTrace?.({ step: "ReAct 收尾", detail: "检测到重复动作，用已有结果强制收尾", data: { action: decision.action } });
      return { outcome: forceFinalize(ctx, "出现重复动作"), store, steps };
    }

    if (isTerminalAction(decision.action)) {
      try {
        const outcome = parseTerminal(decision as ReActStepDecision, ctx, text);
        onTrace?.({
          step: "ReAct 收尾",
          detail: outcome.kind === "final_recommendation"
            ? `给出最终推荐：${outcome.args.cocktailRef}${outcome.args.hallucinatedRef ? `（模型引用了不存在的 ${outcome.args.hallucinatedRef}，已替换为本地匹配）` : ""}`
            : outcome.kind === "ask_clarification"
              ? `向用户澄清：${truncate(outcome.args.question, 60)}`
              : "闲聊直接回复",
          data: { kind: outcome.kind }
        });
        return { outcome, store, steps };
      } catch (error) {
        const message = error instanceof ReActToolArgsError || error instanceof SyntaxError
          ? (error as Error).message
          : undefined;
        if (message === undefined) throw error;
        steps.push({ ...decision, observation: { error: `终结动作参数无效：${message}，请修正后重新输出` } });
        errorStrikes = message === lastErrorMessage ? errorStrikes + 1 : 1;
        lastErrorMessage = message;
        if (errorStrikes >= 2) {
          return { outcome: forceFinalize(ctx, "连续输出无效参数"), store, steps };
        }
        continue;
      }
    }

    if (!isToolAction(decision.action)) {
      steps.push({ ...decision, observation: { error: `未知动作 "${decision.action}"，请从工具或终结动作中选择` } });
      errorStrikes = decision.action === lastErrorMessage ? errorStrikes + 1 : 1;
      lastErrorMessage = decision.action;
      if (errorStrikes >= 2) {
        return { outcome: forceFinalize(ctx, "连续输出未知动作"), store, steps };
      }
      continue;
    }

    const tool = reactToolRegistry[decision.action];
    onTrace?.({
      step: `调用工具 ${TOOL_LABELS[decision.action]}`,
      detail: truncate(decision.arguments, 160),
      data: { tool: decision.action }
    });

    let observation: unknown;
    try {
      observation = await tool.run(parseArguments(decision.arguments), ctx);
      errorStrikes = 0;
      lastErrorMessage = undefined;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      observation = { error: message };
      errorStrikes = message === lastErrorMessage ? errorStrikes + 1 : 1;
      lastErrorMessage = message;
    }

    onTrace?.({
      step: `工具返回 ${TOOL_LABELS[decision.action]}`,
      detail: truncate(JSON.stringify(observation), 160),
      data: { tool: decision.action }
    });

    steps.push({ ...decision, observation });

    if (errorStrikes >= 2) {
      return { outcome: forceFinalize(ctx, "工具连续失败"), store, steps };
    }
  }

  onTrace?.({ step: "ReAct 收尾", detail: `达到最大步数 ${maxSteps}，用已有结果强制收尾`, data: { maxSteps } });
  return { outcome: forceFinalize(ctx, "达到最大步数"), store, steps };
}
