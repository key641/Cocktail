import { parseRequestForAgent } from "../ai/parseRequest";
import type { OpenAIJsonClient } from "../ai/openaiClient";
import { generateRecommendationNarrative } from "../ai/recommendationNarrative";
import {
  buildAgentMessageTool,
  generateShareCaptionTool,
  getCocktailRecipeTool,
  getVisualSpecTool,
  matchCocktailsTool,
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
  trustSignalsForSource
} from "./orchestration";
import type { AgentDrinkCandidate, AgentSessionState, AgentTraceEntry, BartenderAgentResponse } from "./types";

type RunBartenderAgentInput = {
  text: string;
  client?: OpenAIJsonClient;
  session?: AgentSessionState;
  onTrace?: (entry: AgentTraceEntry) => void;
};

export async function runBartenderAgent({ text, client, session, onTrace }: RunBartenderAgentInput): Promise<BartenderAgentResponse> {
  const parsed = await parseRequestForAgent({
    text,
    client
  });
  const understanding = understandingTool(parsed.preference);
  const trace: AgentTraceEntry[] = [];
  function pushTrace(entry: AgentTraceEntry) {
    trace.push(entry);
    onTrace?.(entry);
  }

  pushTrace({
    step: "解析用户请求",
    detail: `解析来源：${parsed.source === "ai" ? "AI 解析" : "本地解析"}，口味偏好：${parsed.preference.flavorPreferences.join("、") || "无"}，可用材料：${parsed.preference.availableIngredients.join("、") || "未提供"}`,
    data: { source: parsed.source, preference: parsed.preference }
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
    data: { intent, requestType: parsed.preference.requestType }
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
    const message = buildCapabilityMessage();
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

  const matched = matchCocktailsTool(parsed.preference, text);

  pushTrace({
    step: "鸡尾酒匹配",
    detail: `主推荐：${matched.primaryRecommendation.cocktail.name}（得分 ${matched.primaryRecommendation.score}），备选 ${matched.alternatives.length} 款`,
    data: {
      primary: { name: matched.primaryRecommendation.cocktail.name, score: matched.primaryRecommendation.score },
      alternativesCount: matched.alternatives.length
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
  const narrative = await generateRecommendationNarrative({
    client,
    cocktail: matched.primaryRecommendation.cocktail,
    preference: parsed.preference,
    fallbackReason: message,
    maxReasonChars: reasonMaxChars
  });
  const alternativeNarratives = await Promise.all(
    matched.alternatives.slice(0, alternativeCandidates.length).map((alternative) =>
      generateRecommendationNarrative({
        client,
        cocktail: alternative.cocktail,
        preference: parsed.preference,
        fallbackReason: alternative.reason,
        maxReasonChars: reasonMaxChars
      })
    )
  );
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

function buildCapabilityMessage() {
  return [
    "我是一位偏实用的 AI 调酒师，可以陪你闲聊，但我的主业是帮你把“今晚喝什么”变清楚。",
    "我能做：按口味/场景推荐鸡尾酒；根据你手边材料匹配能做的酒；解释酒感、强度和缺少材料；给经典酒做轻改编；查询或核对官方/可信配方；生成跟调步骤和分享文案。",
    "我的边界：我不是医疗或法律顾问，不会鼓励酒驾、服药饮酒或未成年人饮酒；不确定的外部配方会标注来源和置信度；如果你只想聊天，我也会尽量聊，但会优先围绕鸡尾酒、酒单和口味帮你。"
  ].join("\n\n");
}
