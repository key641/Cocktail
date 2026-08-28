import type { OpenAIJsonClient } from "../../ai/openaiClient";
import { parseUserPreference, type ParsedPreference } from "../../../src/domain/preferenceParser";
import {
  buildRecommendationBundle,
  citationsFromExternalResult,
  externalRecipeToCandidate,
  localRecommendationToCandidate,
  mergeAgentSession,
  trustSignalsForSource
} from "../orchestration";
import { getCocktailRecipeTool, getVisualSpecTool, safetyCheckTool, understandingTool } from "../tools";
import type {
  AgentDrinkCandidate,
  AgentSessionState,
  AgentTraceEntry,
  BartenderAgentResponse,
  TrustSignal
} from "../types";
import { runReActLoop } from "./reactLoop";
import type { ReActFinalArgs, ReActOutcome, ReActStore } from "./types";

export type RunReActAgentInput = {
  text: string;
  client: OpenAIJsonClient;
  session?: AgentSessionState;
  onTrace?: (entry: AgentTraceEntry) => void;
  maxSteps?: number;
  wallClockMs?: number;
};

function baseToolResults(preference: ParsedPreference, text: string, ownedIngredients?: string[]) {
  return {
    parseSource: "ai" as const,
    preference,
    safety: safetyCheckTool(text),
    ownedIngredients: ownedIngredients ?? preference.availableIngredients
  };
}

function buildFinalResponse({
  args,
  store,
  text,
  session,
  trace
}: {
  args: ReActFinalArgs;
  store: ReActStore;
  text: string;
  session?: AgentSessionState;
  trace: AgentTraceEntry[];
}): BartenderAgentResponse {
  const preference = store.lastMatch?.preference ?? parseUserPreference(text);
  const understanding = understandingTool(preference);
  const mergedSession = mergeAgentSession(preference, session);

  function resolveCandidate(ref: string): AgentDrinkCandidate | undefined {
    const local = store.localCandidates.get(ref);
    if (local) {
      return localRecommendationToCandidate(local);
    }
    const external = store.externalRecipes.get(ref);
    return external ? externalRecipeToCandidate(external) : undefined;
  }

  const localPrimary = store.localCandidates.get(args.cocktailRef);
  const externalPrimary = store.externalRecipes.get(args.cocktailRef);
  let primaryCandidate = resolveCandidate(args.cocktailRef);
  if (!primaryCandidate) {
    // guardFinalArgs 已保证 ref 有效，这里只是类型层面的兜底
    throw new Error(`无法解析推荐引用 ${args.cocktailRef}`);
  }
  primaryCandidate = { ...primaryCandidate, reason: args.reason };

  let alternativeCandidates = args.alternativeRefs
    .map(resolveCandidate)
    .filter((candidate): candidate is AgentDrinkCandidate => Boolean(candidate));
  if (alternativeCandidates.length === 0 && store.lastMatch) {
    alternativeCandidates = store.lastMatch.alternatives
      .filter((item) => item.cocktail.id !== args.cocktailRef)
      .slice(0, 2)
      .map(localRecommendationToCandidate);
  }

  let trustSignals: TrustSignal[] = externalPrimary
    ? trustSignalsForSource(externalPrimary.sourceType, primaryCandidate.source)
    : trustSignalsForSource(undefined, "local_classic");
  const citations = externalPrimary ? citationsFromExternalResult(externalPrimary) : [];

  const twist = store.twist && store.twist.baseCocktailId === args.cocktailRef ? store.twist.suggestion : undefined;
  if (twist) {
    primaryCandidate = {
      ...primaryCandidate,
      source: "classic_twist",
      tags: Array.from(new Set([...primaryCandidate.tags, "Twist"]))
    };
    trustSignals = trustSignalsForSource(undefined, "classic_twist");
  }
  if (args.hallucinatedRef) {
    trustSignals = [
      ...trustSignals,
      { type: "uncertain", label: "已自动纠正", description: `模型引用了不存在的酒款 ${args.hallucinatedRef}，已替换为本地匹配结果` }
    ];
  }

  const recipe = localPrimary ? getCocktailRecipeTool(args.cocktailRef) : undefined;
  const localAlternatives = args.alternativeRefs
    .map((ref) => store.localCandidates.get(ref))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    status: "ok",
    agentMode: "openai_responses_tools",
    intent: args.intent,
    message: args.reason,
    bartenderJudgement: args.reason,
    understanding,
    recommendation: buildRecommendationBundle({
      primary: primaryCandidate,
      alternatives: alternativeCandidates,
      reason: args.reason,
      ownedIngredients: store.lastMatch?.ownedIngredients ?? [],
      missingIngredients: localPrimary?.missingIngredients ?? [],
      difficulty: preference.difficulty
    }),
    trustSignals,
    citations,
    primaryRecommendation: localPrimary ? { ...localPrimary, reason: args.reason } : undefined,
    alternatives: localAlternatives.length > 0
      ? localAlternatives
      : store.lastMatch?.alternatives.filter((item) => item.cocktail.id !== args.cocktailRef) ?? [],
    recipe: recipe
      ? {
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          bartenderTip: recipe.bartenderTip
        }
      : undefined,
    twist,
    shareCaption: store.shareCaption,
    visualSpec: localPrimary ? getVisualSpecTool(args.cocktailRef) : undefined,
    followUpActions: args.followUp ?? ["view_recipe", "follow_along", "try_another", "verify_recipe"],
    sessionPatch: {
      ...mergedSession,
      lastRecommendationIds: [
        primaryCandidate.id,
        ...mergedSession.lastRecommendationIds.filter((id) => id !== primaryCandidate.id)
      ].slice(0, 5)
    },
    agentTrace: trace,
    toolResults: baseToolResults(preference, text, store.lastMatch?.ownedIngredients)
  };
}

function buildOutcomeResponse({
  outcome,
  store,
  text,
  session,
  trace
}: {
  outcome: ReActOutcome;
  store: ReActStore;
  text: string;
  session?: AgentSessionState;
  trace: AgentTraceEntry[];
}): BartenderAgentResponse {
  if (outcome.kind === "final_recommendation") {
    return buildFinalResponse({ args: outcome.args, store, text, session, trace });
  }

  const preference = parseUserPreference(text);
  const understanding = understandingTool(preference);
  const mergedSession = mergeAgentSession(preference, session);
  const shared = {
    status: "ok" as const,
    agentMode: "openai_responses_tools" as const,
    understanding,
    trustSignals: [],
    citations: [],
    alternatives: [],
    agentTrace: trace,
    sessionPatch: mergedSession,
    toolResults: baseToolResults(preference, text)
  };

  if (outcome.kind === "ask_clarification") {
    return {
      ...shared,
      intent: "clarification",
      message: outcome.args.question,
      bartenderJudgement: outcome.args.question,
      clarification: outcome.args,
      followUpActions: ["open_ingredients"]
    };
  }

  return {
    ...shared,
    intent: "smalltalk",
    message: outcome.args.reply,
    bartenderJudgement: outcome.args.reply,
    followUpActions: ["open_ingredients", "try_another"]
  };
}

export async function runReActAgent({ text, client, session, onTrace, maxSteps, wallClockMs }: RunReActAgentInput): Promise<BartenderAgentResponse> {
  const trace: AgentTraceEntry[] = [];
  function pushTrace(entry: AgentTraceEntry) {
    trace.push(entry);
    onTrace?.(entry);
  }

  // 确定性安全守门：不交给模型判断
  const safety = safetyCheckTool(text);
  pushTrace({
    step: "安全检查",
    detail: safety.shouldAvoidAlcohol ? `触发安全拦截：${safety.message}` : "通过，无安全风险",
    data: { shouldAvoidAlcohol: safety.shouldAvoidAlcohol }
  });
  if (safety.shouldAvoidAlcohol) {
    const preference = parseUserPreference(text);
    return {
      status: "safety_blocked",
      agentMode: "openai_responses_tools",
      intent: "safe_mocktail",
      message: safety.message,
      bartenderJudgement: safety.message,
      understanding: understandingTool(preference),
      trustSignals: [],
      citations: [],
      alternatives: [],
      agentTrace: trace,
      followUpActions: ["safe_mocktail"],
      sessionPatch: mergeAgentSession(preference, session),
      toolResults: {
        parseSource: "ai",
        preference,
        safety,
        ownedIngredients: preference.availableIngredients
      }
    };
  }

  pushTrace({ step: "ReAct 启动", detail: "进入思考-行动-观察循环，由模型自主决定调用哪些工具", data: { engine: "react" } });
  const { outcome, store } = await runReActLoop({ text, client, session, onTrace: pushTrace, maxSteps, wallClockMs });
  return buildOutcomeResponse({ outcome, store, text, session, trace });
}
