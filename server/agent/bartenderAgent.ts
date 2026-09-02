import { parseRequestForAgent } from "../ai/parseRequest";
import type { OpenAIJsonClient } from "../ai/openaiClient";
import { generateRecommendationNarrativeBatch } from "../ai/recommendationNarrative";
import {
  buildAgentMessageTool,
  generateShareCaptionTool,
  getCocktailRecipeTool,
  getVisualSpecTool,
  matchCocktailsTool,
  searchCocktailsTool,
  searchCocktailInspirationTool,
  searchCocktailRecipeTool,
  suggestClassicTwistTool,
  understandingTool
} from "./tools";
import {
  buildRecommendationBundle,
  citationsFromExternalResult,
  evaluateRecommendationConfidence,
  extractRequestedCocktailName,
  externalRecipeToCandidate,
  localRecommendationToCandidate,
  mergeAgentSession,
  routeAgentIntent,
  isDirectCocktailSearch,
  trustSignalsForSource
} from "./orchestration";
import type { AgentDrinkCandidate, AgentSessionState, AgentTraceEntry, BartenderAgentResponse } from "./types";
import { runReActAgent } from "./react/adapter";

export type AgentEngine = "react" | "pipeline";

type RunBartenderAgentInput = {
  text: string;
  client?: OpenAIJsonClient;
  parserClient?: OpenAIJsonClient;
  narrativeClient?: OpenAIJsonClient;
  session?: AgentSessionState;
  onTrace?: (entry: AgentTraceEntry) => void;
  engine?: AgentEngine;
};

export function resolveAgentEngine(value?: string): AgentEngine {
  return value === "react" ? "react" : "pipeline";
}

function envInt(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function runBartenderAgent(input: RunBartenderAgentInput): Promise<BartenderAgentResponse> {
  const engine = input.engine ?? resolveAgentEngine(process.env.AGENT_ENGINE);

  if (engine === "react" && input.client && !isDirectCocktailSearch(input.text)) {
    try {
      return await runReActAgent({
        text: input.text,
        client: input.client,
        session: input.session,
        onTrace: input.onTrace,
        maxSteps: envInt("REACT_MAX_STEPS", 4),
        wallClockMs: envInt("REACT_WALL_CLOCK_MS", 20000)
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      input.onTrace?.({
        step: "引擎降级",
        detail: `ReAct 引擎失败（${message}），降级到固定管线`,
        data: { engine: "pipeline", reason: message }
      });
    }
  }

  return runPipelineAgent(input);
}

export async function runPipelineAgent({ text, client, parserClient, narrativeClient, session, onTrace }: RunBartenderAgentInput): Promise<BartenderAgentResponse> {
  const parsed = await parseRequestForAgent({
    text,
    client: parserClient ?? client
  });
  const understanding = understandingTool(parsed.preference);
  const trace: AgentTraceEntry[] = [];
  function pushTrace(entry: AgentTraceEntry) {
    trace.push(entry);
    onTrace?.(entry);
  }

  pushTrace({
    step: "解析用户请求",
    detail: `解析来源：${parsed.source === "ai" ? "AI 解析" : "本地解析"}，动作：${parsed.preference.action ?? "未识别"}，耗时：${parsed.debug?.latencyMs ?? 0}ms，候选：${parsed.debug?.candidateCocktailIds?.join("、") || "无"}`,
    data: { source: parsed.source, preference: parsed.preference, debug: parsed.debug }
  });

  pushTrace({
    step: "安全检查",
    detail: parsed.safety.shouldAvoidAlcohol ? `触发安全拦截：${parsed.safety.message}` : "通过，无安全风险",
    data: { shouldAvoidAlcohol: parsed.safety.shouldAvoidAlcohol }
  });
  const intent = routeAgentIntent({
    text,
    preference: parsed.preference,
    safetyBlocked: parsed.safety.shouldAvoidAlcohol
  });
  const mergedSession = mergeAgentSession(parsed.preference, session);

  const intentLabels: Record<string, string> = {
    classic_recommendation: "经典推荐",
    ingredient_matching: "材料匹配",
    recipe_lookup: "本地配方查找",
    named_cocktail_lookup: "指定酒款查找",
    official_recipe_check: "官方配方验证",
    classic_twist: "经典改编",
    external_inspiration: "外部灵感搜索",
    share_caption: "生成分享卡片",
    safe_mocktail: "安全无酒精",
    smalltalk: "闲聊与能力说明"
  };
  pushTrace({
    step: "意图识别",
    detail: `识别意图：${intentLabels[intent] || intent}，请求类型：${parsed.preference.requestType}`,
    data: { intent, requestType: parsed.preference.requestType, action: parsed.preference.action }
  });

  pushTrace({
    step: "风味理解",
    detail: `口味：${understanding.flavors.join("、") || "未识别"}，强度：${understanding.strength}，场景：${understanding.occasion}`,
    data: understanding
  });

  if (parsed.safety.shouldAvoidAlcohol) {
    return {
      status: "safety_blocked",
      agentMode: "local_tools",
      intent,
      message: parsed.safety.message,
      bartenderJudgement: parsed.safety.message,
      understanding,
      trustSignals: [],
      citations: [],
      alternatives: [],
      agentTrace: trace,
      followUpActions: ["safe_mocktail"],
      sessionPatch: mergedSession,
      toolResults: {
        parseSource: parsed.source,
        fallbackReason: parsed.debug?.fallbackReason,
        preference: parsed.preference,
        safety: parsed.safety,
        ownedIngredients: parsed.preference.availableIngredients
      }
    };
  }

  if (intent === "smalltalk") {
    const message = buildSmalltalkMessage(text);
    pushTrace({
      step: "能力说明",
      detail: "用户在问候、闲聊或询问能力范围；不触发酒款推荐，只说明可做与不可做的事。",
      data: { intent }
    });

    return {
      status: "ok",
      agentMode: parsed.source === "ai" ? "openai_responses_tools" : "local_tools",
      intent,
      message,
      bartenderJudgement: message,
      understanding,
      trustSignals: [],
      citations: [],
      alternatives: [],
      agentTrace: trace,
      followUpActions: ["open_ingredients", "try_another"],
      sessionPatch: mergedSession,
      toolResults: {
        parseSource: parsed.source,
        fallbackReason: parsed.debug?.fallbackReason,
        preference: parsed.preference,
        safety: parsed.safety,
        ownedIngredients: parsed.preference.availableIngredients
      }
    };
  }

  const searched = isDirectCocktailSearch(text) ? searchCocktailsTool(text) : undefined;
  if (searched && !searched.exact) {
    pushTrace({
      step: "酒款搜索",
      detail: "本地酒库未精确命中该酒名，继续查找外部可靠配方。",
      data: { query: text, candidates: searched.candidates.map((candidate) => candidate.cocktail.id) }
    });
  }
  const matched = searched?.exact
    ? {
        primaryRecommendation: searched.exact,
        alternatives: searched.candidates.filter((candidate) => candidate.cocktail.id !== searched.exact?.cocktail.id).slice(0, 2),
        ownedIngredients: [],
        retrievalCandidates: searched.candidates.map((candidate) => ({
          id: candidate.cocktail.id,
          name: candidate.cocktail.name,
          score: candidate.score,
          evidence: [candidate.reason]
        }))
      }
    : matchCocktailsTool(parsed.preference, text);

  pushTrace({
    step: searched?.exact ? "酒款搜索" : "鸡尾酒匹配",
    detail: searched?.exact
      ? `按酒名搜索本地酒库，命中 ${matched.primaryRecommendation.cocktail.name}`
      : `主推荐：${matched.primaryRecommendation.cocktail.name}（得分 ${matched.primaryRecommendation.score}），备选 ${matched.alternatives.length} 款，检索候选 ${matched.retrievalCandidates.length} 款`,
    data: {
      primary: { name: matched.primaryRecommendation.cocktail.name, score: matched.primaryRecommendation.score },
      alternativesCount: matched.alternatives.length,
      retrievalCandidates: matched.retrievalCandidates
    }
  });
  const cocktailId = matched.primaryRecommendation.cocktail.id;
  const confidence = evaluateRecommendationConfidence({
    text,
    preference: parsed.preference,
    recommendation: matched.primaryRecommendation
  });
  const localPrimary = localRecommendationToCandidate(matched.primaryRecommendation);

  pushTrace({
    step: "置信度评估",
    detail: `得分 ${confidence.score}/100（${confidence.level === "high" ? "高" : confidence.level === "medium" ? "中" : "低"}）${confidence.reasons.length ? "，原因：" + confidence.reasons.join("；") : ""}${confidence.shouldSearchExternal ? "，将触发外部搜索" : ""}`,
    data: confidence
  });
  const localAlternatives = matched.alternatives.map(localRecommendationToCandidate);
  const recipe = getCocktailRecipeTool(cocktailId);
  const twist = parsed.preference.requestType === "classic_twist"
    ? suggestClassicTwistTool(cocktailId, {
        flavorPreferences: parsed.preference.flavorPreferences,
        dislikedFlavors: parsed.preference.dislikedFlavors,
        strengthPreference: parsed.preference.strengthPreference,
        occasion: parsed.preference.occasion
      })
    : undefined;
  const shareCaption = parsed.preference.requestType === "menu_share"
    ? generateShareCaptionTool(cocktailId, "casual_share")
    : undefined;
  const visualSpec = getVisualSpecTool(cocktailId);
  let agentMode: BartenderAgentResponse["agentMode"] = parsed.source === "ai" ? "openai_responses_tools" : "local_tools";
  let primaryCandidate: AgentDrinkCandidate = localPrimary;
  let alternativeCandidates = localAlternatives;
  let trustSignals = trustSignalsForSource(undefined, "local_classic");
  let citations: BartenderAgentResponse["citations"] = [];
  let message = buildAgentMessageTool({
    preference: parsed.preference,
    recommendation: matched.primaryRecommendation,
    missingIngredients: matched.primaryRecommendation.missingIngredients
  });
  if (intent === "recipe_lookup") {
    message = `找到了 ${matched.primaryRecommendation.cocktail.name}。下面是这杯酒的材料、步骤和调制提示。`;
  }
  if (intent === "named_cocktail_lookup") {
    const requestedName = extractRequestedCocktailName(text) ?? text;
    const external = await searchCocktailRecipeTool({
      query: `${requestedName} cocktail recipe`,
      client
    });
    if (external.status === "found" && external.confidence >= 0.55) {
      agentMode = "openai_responses_tools";
      primaryCandidate = externalRecipeToCandidate(external);
      alternativeCandidates = [localPrimary, ...localAlternatives].slice(0, 2);
      trustSignals = trustSignalsForSource(external.sourceType, primaryCandidate.source);
      citations = citationsFromExternalResult(external);
      message = `${external.cocktailName} is not in the local menu yet. I found an external recipe source and marked it for verification.`;
      pushTrace({
        step: "外部酒款查找",
        detail: `搜索 "${requestedName}"：找到外部配方 ${external.cocktailName}，置信度 ${external.confidence}，来源 ${external.sourceType}`,
        data: { cocktailName: external.cocktailName, confidence: external.confidence, sourceType: external.sourceType }
      });
    } else {
      trustSignals = [{ type: "uncertain", label: "待确认", description: external.notes }];
      message = `I could not find a reliable external recipe for ${requestedName}, so I am giving you the closest local classic first.`;
      pushTrace({
        step: "外部酒款查找",
        detail: `搜索 "${requestedName}"：未找到可靠配方，回退到本地经典`,
        data: { status: external.status, query: requestedName }
      });
    }
  }

  if (intent === "official_recipe_check") {
    const requestedName = extractRequestedCocktailName(text) ?? matched.primaryRecommendation.cocktail.englishName;
    const external = await searchCocktailRecipeTool({
      query: `${requestedName} IBA official cocktail recipe`,
      officialOnly: true,
      client
    });
    if (external.status === "found") {
      agentMode = "openai_responses_tools";
      trustSignals = trustSignalsForSource(external.sourceType);
      citations = citationsFromExternalResult(external);
      message = `${message} Recipe source has been checked against the requested official/standard source.`;
      pushTrace({
        step: "官方配方验证",
        detail: `验证 "${requestedName}"：找到官方配方，来源 ${external.sourceType}，置信度 ${external.confidence}`,
        data: { sourceType: external.sourceType, confidence: external.confidence }
      });
    } else {
      trustSignals = [
        ...trustSignals,
        { type: "uncertain", label: "查证失败", description: external.notes }
      ];
    }
  }

  if (intent === "external_inspiration" || confidence.shouldSearchExternal) {
    const external = await searchCocktailInspirationTool({
      query: text,
      client
    });
    const usable = external.candidates.find((candidate) => candidate.confidence >= 0.55);
    if (usable) {
      agentMode = "openai_responses_tools";
      primaryCandidate = externalRecipeToCandidate({
        status: "found",
        ...usable,
        sourceUrl: external.citations[0]?.url,
        citations: external.citations
      });
      alternativeCandidates = [
        ...external.candidates
          .filter((candidate) => candidate.cocktailName !== usable.cocktailName && candidate.confidence >= 0.55)
          .map((candidate) => externalRecipeToCandidate({
            status: "found",
            ...candidate,
            sourceUrl: external.citations[0]?.url,
            citations: external.citations
          })),
        localPrimary
      ].slice(0, 2);
      trustSignals = trustSignalsForSource(usable.sourceType, primaryCandidate.source);
      citations = external.citations.map((citation) => ({ ...citation, sourceType: usable.sourceType }));
      message = "The local menu did not match that feeling closely enough, so I checked for a better classic or modern-classic direction.";
      pushTrace({
        step: "外部灵感搜索",
        detail: `本地匹配不够理想，触发外部搜索，找到 ${usable.cocktailName}（置信度 ${usable.confidence}）`,
        data: { primary: usable.cocktailName, confidence: usable.confidence }
      });
    } else if (confidence.level === "low") {
      trustSignals = [{ type: "uncertain", label: "本地匹配较弱", description: external.notes || confidence.reasons.join(" ") }];
    }
  }

  if (twist) {
    primaryCandidate = {
      ...primaryCandidate,
      source: "classic_twist",
      tags: Array.from(new Set([...primaryCandidate.tags, "Twist"]))
    };
    trustSignals = trustSignalsForSource(undefined, "classic_twist");
    pushTrace({
      step: "经典改编",
      detail: `基于 ${cocktailId} 生成了经典改编版本`,
      data: { baseCocktail: cocktailId }
    });
  }

  const reasonMaxChars = 56;
  const narrativeBatch = await generateRecommendationNarrativeBatch({
    client: intent === "recipe_lookup" ? undefined : narrativeClient ?? client,
    preference: parsed.preference,
    fallbackMessage: message,
    primary: {
      cocktail: matched.primaryRecommendation.cocktail,
      fallbackReason: message
    },
    alternatives: matched.alternatives.slice(0, alternativeCandidates.length).map((alternative) => ({
      cocktail: alternative.cocktail,
      fallbackReason: alternative.reason
    })),
    maxReasonChars: reasonMaxChars
  });
  const narrative = narrativeBatch.primary;
  const alternativeNarratives = narrativeBatch.alternatives;
  if (["classic_recommendation", "ingredient_matching", "classic_twist"].includes(intent)) {
    message = narrativeBatch.message;
  }
  if (narrative.source === "ai") {
    agentMode = "openai_responses_tools";
  }
  if (alternativeNarratives.some((item) => item.source === "ai")) {
    agentMode = "openai_responses_tools";
  }
  primaryCandidate = {
    ...primaryCandidate,
    reason: narrative.recommendationReason
  };
  alternativeCandidates = alternativeCandidates.map((candidate, index) => ({
    ...candidate,
    reason: alternativeNarratives[index]?.recommendationReason ?? candidate.reason
  }));
  pushTrace({
    step: "生成推荐文案",
    detail: `推荐文案来源：${narrative.source === "ai" ? "AI 生成" : "本地生成"}，备选文案来源：${alternativeNarratives.filter(n => n.source === "ai").length}/${alternativeNarratives.length} 个用 AI`,
    data: { primarySource: narrative.source, altAiCount: alternativeNarratives.filter(n => n.source === "ai").length }
  });

  pushTrace({
    step: "最终输出",
    detail: `Agent 模式：${agentMode}，主推荐：${primaryCandidate.name}，备选 ${alternativeCandidates.length} 个`,
    data: { agentMode, primaryName: primaryCandidate.name }
  });

  const enrichedMatchedAlternatives = matched.alternatives.map((alternative, index) => ({
    ...alternative,
    reason: alternativeNarratives[index]?.recommendationReason ?? alternative.reason
  }));

  return {
    status: "ok",
    agentMode,
    intent,
    message,
    bartenderJudgement: message,
    narrative,
    understanding,
    recommendation: buildRecommendationBundle({
      primary: primaryCandidate,
      alternatives: alternativeCandidates,
      reason: narrative.recommendationReason,
      narrative,
      ownedIngredients: matched.ownedIngredients,
      missingIngredients: matched.primaryRecommendation.missingIngredients,
      difficulty: parsed.preference.difficulty
    }),
    trustSignals,
    citations,
    primaryRecommendation: matched.primaryRecommendation,
    alternatives: enrichedMatchedAlternatives,
    recipe: recipe
      ? {
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          bartenderTip: recipe.bartenderTip
        }
      : undefined,
    twist,
    shareCaption,
    visualSpec,
    followUpActions: ["view_recipe", "follow_along", "try_another", "verify_recipe"],
    sessionPatch: {
      ...mergedSession,
      lastRecommendationIds: [
        primaryCandidate.id,
        ...mergedSession.lastRecommendationIds.filter((id) => id !== primaryCandidate.id)
      ].slice(0, 5)
    },
    agentTrace: trace,
    debug: {
      confidence
    },
    toolResults: {
      parseSource: parsed.source,
      fallbackReason: parsed.debug?.fallbackReason,
      preference: parsed.preference,
      safety: parsed.safety,
      ownedIngredients: matched.ownedIngredients
    }
  };
}

function buildSmalltalkMessage(text: string) {
  if (/怎么用|如何用|使用|帮助|\bhelp\b/i.test(text)) {
    return [
      "当然。你可以把我当成一个不端架子的随身小酒保：不用说得很专业，直接讲感觉就行。",
      "可以这样问我：",
      "1. “我想喝清爽、酸一点、带气泡感，适合夏天。”",
      "2. “家里有金酒、柠檬和糖浆，可以做什么？”",
      "3. “像 Margarita，但别那么烈。”",
      "你给我口味、场景、材料，或者一杯你想靠近/避开的酒，我就帮你缩小选择。"
    ].join("\n\n");
  }

  if (/你是谁|你能做什么|能干什么|有什么能力|能力范围|能帮我|怎么选酒/i.test(text)) {
    return [
      "我可以当你的随身小酒保。你不用背酒名，告诉我心情、口味、场景，或者把家里材料丢给我，我来帮你把“今晚喝什么”变清楚。",
      "我比较擅长：按口味推荐酒、用现有材料匹配能做的酒、解释为什么适合你、告诉你缺什么、把经典酒改轻一点/甜一点/清爽一点，也可以核对官方或可信配方。",
      "边界也说清楚：涉及开车、服药、未成年或健康风险时，我会优先劝你别喝，或者帮你转成无酒精方向。"
    ].join("\n\n");
  }

  return [
    "在呢。今晚这个小酒保上线。",
    "你可以随便一点说：想清爽、想甜一点、不要太烈、家里只有几样材料、想要像某杯经典但换个方向——我都能接。",
    "如果你只是来聊两句也可以；但我最会的，还是把模糊的口味翻译成一杯更适合你的酒。"
  ].join("\n\n");
}
