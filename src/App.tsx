import { useEffect, useMemo, useRef, useState } from "react";
import { ChatPanel, type ChatMessage, type ThinkingStep } from "./components/ChatPanel";
import { CocktailCard } from "./components/CocktailCard";
import { ExplorePanel, type ExploreChoices } from "./components/ExplorePanel";
import { FeedbackEntry } from "./components/FeedbackEntry";
import { FollowAlongView } from "./components/FollowAlongView";
import { Home } from "./components/Home";
import { IngredientPanel } from "./components/IngredientPanel";
import { BottomNav } from "./components/BottomNav";
import { MenuView } from "./components/MenuView";
import { ResultView } from "./components/ResultView";
import { ShareCardView } from "./components/ShareCardView";
import { SvgAtomGallery } from "./components/SvgAtomGallery";
import { MyBarView } from "./components/MyBarView";
import ConnectionStatus from "./components/ConnectionStatus";
import { cocktails } from "./data/cocktails";
import { getIngredientName } from "./data/ingredients";
import { buildAgentRecommendation, moodFromPreference, strengthFromPreference, tasteFromPreference } from "./domain/agentFlow";
import { buildBartenderOneLiner, buildUnderstandingSummary, type UnderstandingSummary } from "./domain/agentNarrative";
import { parseIngredientsLocally } from "./domain/ingredientParser";
import { parseUserPreference, type ParsedPreference } from "./domain/preferenceParser";
import { recommendByIngredients } from "./domain/recommendation";
import { checkAlcoholSafety, type AlcoholSafetyResult } from "./domain/safety";
import type { CaptionStyle } from "./domain/captionGenerator";
import type { AgentRecommendationBundle, AgentSessionState, Citation, TrustSignal } from "./domain/agentTypes";
import type { CocktailRecommendation, TasteProfile } from "./domain/types";
import { rankForExploration } from "./domain/recommendation";
import { API_BASE } from "./config/api";
import { addRecentCocktail, loadUserProfile, saveUserProfile, toggleFavoriteCocktail } from "./domain/userProfile";

type Screen = "home" | "chat" | "explore" | "ingredients" | "menu" | "atoms" | "my" | "result" | "follow" | "share";

const VALID_SCREENS: Screen[] = ["home", "chat", "explore", "ingredients", "menu", "atoms", "my", "result", "follow", "share"];

function isBottomNavScreen(s: Screen): boolean {
  return s === "home" || s === "menu" || s === "atoms" || s === "my";
}

const defaultTasteProfile: TasteProfile = {
  sweet: 2, sour: 3, bitter: 1, fresh: 4, strong: 2, fruity: 2, herbal: 1, bubbly: 0
};

let messageIdCounter = 0;
function nextMessageId() {
  return `msg-${++messageIdCounter}`;
}

export function beginChatTurn(messages: ChatMessage[], userId: string, aiId: string, text: string): ChatMessage[] {
  const cleaned = messages.filter((message) => {
    if (message.role !== "ai") return true;
    return Boolean(message.text || message.recommendation);
  });
  return [
    ...cleaned,
    { id: userId, role: "user", text },
    { id: aiId, role: "ai", text: "", thinkingSteps: [], isPending: true }
  ];
}

function readPhotoAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unsupported photo result"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Photo read failed"));
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------ */
/*  Network helpers                                                    */
/* ------------------------------------------------------------------ */

async function parseIngredientsWithFallback(text: string) {
  if (!text.trim()) return { ingredients: [], unknown: [] };
  try {
    const response = await fetch(`${API_BASE}/api/parse-ingredients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!response.ok) throw new Error("API unavailable");
    return (await response.json()) as { ingredients: string[]; unknown: string[] };
  } catch {
    return parseIngredientsLocally(text);
  }
}

async function parseAgentRequestWithFallback(text: string): Promise<{
  preference: ParsedPreference;
  safety: AlcoholSafetyResult;
}> {
  try {
    const response = await fetch(`${API_BASE}/api/ai/parse-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!response.ok) throw new Error("API unavailable");
    return (await response.json()) as { preference: ParsedPreference; safety: AlcoholSafetyResult };
  } catch {
    return {
      preference: parseUserPreference(text),
      safety: checkAlcoholSafety(text)
    };
  }
}

/* ------------------------------------------------------------------ */
/*  AI response text builder                                           */
/* ------------------------------------------------------------------ */

function buildAiResponseText(result: Record<string, unknown>): string {
  const narrative = result.narrative as Record<string, unknown> | undefined;
  const message = result.message as string | undefined;
  const recommendation = result.recommendation as AgentRecommendationBundle | undefined;

  if (narrative) {
    const parts: string[] = [];
    if (narrative.cocktailIntro) parts.push(narrative.cocktailIntro as string);
    if (narrative.flavorExpectation) parts.push(narrative.flavorExpectation as string);
    if (narrative.recommendationReason) parts.push(narrative.recommendationReason as string);
    if (parts.length > 0) return parts.join("\n\n");
  }

  if (recommendation?.reason) return recommendation.reason;
  if (message) return message;
  return "我为你找到了合适的鸡尾酒，看看下面的推荐吧~";
}

/* ------------------------------------------------------------------ */
/*  App component                                                      */
/* ------------------------------------------------------------------ */

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [userProfile, setUserProfile] = useState(loadUserProfile);
  const [ingredientPurpose, setIngredientPurpose] = useState<"recommend" | "manage">("recommend");
  const [feedbackCount, setFeedbackCount] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem("cocktail-feedback") ?? "[]").length as number;
    } catch {
      return 0;
    }
  });
  const scrollPositions = useRef<Partial<Record<Screen, number>>>({});
  const screenRef = useRef<Screen>(screen);
  screenRef.current = screen;

  // 切屏共用逻辑：保存当前屏滚动位置后切换（不写浏览器历史）
  function applyScreen(next: Screen) {
    const el = document.querySelector(".screen");
    if (el) scrollPositions.current[screenRef.current] = el.scrollTop;
    // Detail pages always start at top
    if (next === "result" || next === "follow" || next === "share") {
      delete scrollPositions.current[next];
    }
    setScreen(next);
  }

  function navigateTo(next: Screen) {
    if (next === screenRef.current) return;
    applyScreen(next);
    window.history.pushState({ screen: next }, "");
  }
  const [resultBackScreen, setResultBackScreen] = useState<Screen>("home");

  /* --- result-screen state (shared by all paths) --- */
  const [recommendation, setRecommendation] = useState<CocktailRecommendation | null>(null);
  // “换一杯”备用候选：按来源路径的排序结果填充，就地切换用
  const [alternativePool, setAlternativePool] = useState<CocktailRecommendation[]>([]);
  const [ownedIngredients, setOwnedIngredients] = useState<string[]>([]);
  const [unknownIngredients, setUnknownIngredients] = useState<string[]>([]);
  const [bartenderLine, setBartenderLine] = useState("");
  const [agentRecommendation, setAgentRecommendation] = useState<AgentRecommendationBundle | undefined>();
  const [trustSignals, setTrustSignals] = useState<TrustSignal[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);

  /* --- ingredient parsing --- */
  const [isParsing, setIsParsing] = useState(false);

  /* --- chat state --- */
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [latestBundle, setLatestBundle] = useState<AgentRecommendationBundle | undefined>();
  const [latestAlternatives, setLatestAlternatives] = useState<CocktailRecommendation[]>([]);

  /* --- agent session --- */
  const [agentSession, setAgentSession] = useState<AgentSessionState>(userProfile.agentSession);

  /* --- follow / share --- */
  const [activeStep, setActiveStep] = useState(0);
  const [photoUrl, setPhotoUrl] = useState("");
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);
  const [photoError, setPhotoError] = useState("");

  // 浏览器返回/前进手势驱动屏幕切换，避免手势返回直接退出应用
  const recommendationRef = useRef(recommendation);
  recommendationRef.current = recommendation;

  useEffect(() => {
    window.history.replaceState({ screen: screenRef.current }, "");

    function handlePopState(event: PopStateEvent) {
      const stateScreen = (event.state as { screen?: Screen } | null)?.screen;
      let next: Screen = stateScreen && VALID_SCREENS.includes(stateScreen) ? stateScreen : "home";
      // 数据依赖页在推荐状态丢失（如刷新后前进）时回退首页
      if ((next === "result" || next === "follow" || next === "share") && !recommendationRef.current) {
        next = "home";
        window.history.replaceState({ screen: next }, "");
      }
      applyScreen(next);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Restore scroll position when switching screens
  const prevScreenRef = useRef<Screen>(screen);
  if (prevScreenRef.current !== screen) {
    const saved = scrollPositions.current[screen] ?? 0;
    requestAnimationFrame(() => {
      const el = document.querySelector(".screen");
      if (el) el.scrollTop = saved;
    });
    prevScreenRef.current = screen;
  }
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>("casual_share");
  const activeAiIdRef = useRef<string | null>(null);

  const ownedNames = useMemo(() => ownedIngredients.map(getIngredientName), [ownedIngredients]);

  useEffect(() => {
    saveUserProfile(userProfile);
  }, [userProfile]);

  useEffect(() => {
    const handleFeedbackSaved = () => setFeedbackCount((count) => count + 1);
    window.addEventListener("cocktail-feedback-saved", handleFeedbackSaved);
    return () => window.removeEventListener("cocktail-feedback-saved", handleFeedbackSaved);
  }, []);

  useEffect(() => {
    setUserProfile((current) => ({ ...current, agentSession }));
  }, [agentSession]);

  useEffect(() => {
    if (!recommendation) return;
    setUserProfile((current) => addRecentCocktail(current, recommendation.cocktail.id));
  }, [recommendation]);

  /* ------------------------------------------------------------------ */
  /*  Navigation handlers                                                */
  /* ------------------------------------------------------------------ */

  function showExplorationResult(choices: ExploreChoices) {
    const ranked = rankForExploration({
      cocktails,
      mood: choices.mood,
      preferredStrength: choices.strength,
      tasteProfile: choices.tasteProfile,
      seed: choices.seed
    });
    const result = ranked[0];
    setOwnedIngredients([]);
    setUnknownIngredients([]);
    setAgentRecommendation(undefined);
    setTrustSignals([{ type: "local_classic", label: "本地经典酒单", description: "配方来自产品内维护的经典酒单。" }]);
    setCitations([]);
    setRecommendation(result);
    setAlternativePool(ranked.slice(1));
    setResultBackScreen("home");
    navigateTo("result");
  }

  async function showIngredientResult(selected: string[], freeText: string, tasteProfile: TasteProfile) {
    setIsParsing(true);
    const parsed = await parseIngredientsWithFallback(freeText);
    const merged = Array.from(new Set([...selected, ...parsed.ingredients]));
    if (ingredientPurpose === "manage") {
      setUserProfile((current) => ({
        ...current,
        barIngredientIds: merged,
        agentSession: { ...current.agentSession, availableIngredients: merged }
      }));
      setAgentSession((current) => ({ ...current, availableIngredients: merged }));
      setIsParsing(false);
      navigateTo("my");
      return;
    }
    const ranked = recommendByIngredients({
      cocktails,
      ownedIngredientIds: merged,
      tasteProfile
    });
    const [result] = ranked;
    setOwnedIngredients(merged);
    setUnknownIngredients(parsed.unknown);
    setAgentRecommendation(undefined);
    setTrustSignals([{ type: "local_classic", label: "本地经典酒单", description: "根据你现有的材料在本地酒单中匹配。" }]);
    setCitations([]);
    setRecommendation(result);
    setAlternativePool(ranked.slice(1));
    setIsParsing(false);
    setResultBackScreen("home");
    navigateTo("result");
  }

  /* ------------------------------------------------------------------ */
  /*  Chat: SSE-streaming handler                                        */
  /* ------------------------------------------------------------------ */


function cocktailToCandidate(rec: CocktailRecommendation): AgentRecommendationBundle["primary"] {
  const cocktail = rec.cocktail;
  return {
    id: cocktail.id,
    name: cocktail.name,
    englishName: cocktail.englishName,
    recipeMode: "local",
    source: "local_classic",
    confidence: rec.score / 100,
    tags: cocktail.tags,
    reason: rec.reason,
    recipe: {
      ingredients: cocktail.ingredients.map((ing) => ({
        id: ing.ingredientId,
        name: getIngredientName(ing.ingredientId),
        amount: ing.amount,
        optional: ing.optional ?? false
      })),
      steps: cocktail.steps,
      glass: cocktail.glass,
      garnish: cocktail.garnish,
      bartenderTip: cocktail.bartenderTip
    }
  };
}

function buildLocalFallbackBundle(
  primaryRec: CocktailRecommendation,
  altRecs: CocktailRecommendation[],
  ownedIngredients: string[]
): AgentRecommendationBundle {
  return {
    primary: cocktailToCandidate(primaryRec),
    alternatives: altRecs.map(cocktailToCandidate),
    reason: primaryRec.reason,
    executableInfo: {
      ownedIngredients,
      missingIngredients: primaryRec.missingIngredients,
      difficulty: "normal"
    }
  };
}

  async function handleChatSubmit(text: string) {
    const userId = nextMessageId();
    const aiId = nextMessageId();

    setChatMessages((prev) => beginChatTurn(prev, userId, aiId, text));
    activeAiIdRef.current = aiId;
    setIsStreaming(true);

    const thinkingSteps: ThinkingStep[] = [];

    try {
      const response = await fetch(`${API_BASE}/api/agent/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, session: agentSession })
      });

      if (!response.ok || !response.body) {
        throw new Error("Stream unavailable");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (value) {
          buffer += decoder.decode(value, { stream: true });
        }

        // Process complete SSE events (delimited by \n\n)
        const sep = "\n\n";
        let sepIdx;
        while ((sepIdx = buffer.indexOf(sep)) >= 0) {
          const rawEvent = buffer.slice(0, sepIdx);
          buffer = buffer.slice(sepIdx + sep.length);

          // Parse event type and data from each complete event block
          let eventType = "";
          let dataJson = "";
          for (const line of rawEvent.split("\n")) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              dataJson = line.slice(6);
            }
          }

          if (!eventType || !dataJson) continue;

          const data = JSON.parse(dataJson);

          if (eventType === "trace") {
            thinkingSteps.push(data);
            setChatMessages((prev) => {
              const exists = prev.some((msg) => msg.id === aiId);
              if (!exists) {
                return [...prev, { id: aiId, role: "ai", text: "", thinkingSteps: [...thinkingSteps], isPending: true }];
              }
              return prev.map((msg) =>
                msg.id === aiId
                  ? { ...msg, thinkingSteps: [...thinkingSteps] }
                  : msg
              );
            });
          } else if (eventType === "safety_blocked") {
            setChatMessages((prev) => {
              const exists = prev.some((msg) => msg.id === aiId);
              const newMsg = {
                id: aiId,
                role: "ai" as const,
                text: data.message || "为了你的健康，我不建议你饮酒哦。要不要试试无酒精版本？",
                thinkingSteps: [...thinkingSteps],
                safetyMessage: data.message,
                isPending: false
              };
              if (!exists) return [...prev, newMsg];
              return prev.map((msg) =>
                msg.id === aiId
                  ? { ...msg, ...newMsg }
                  : msg
              );
            });
            setIsStreaming(false);
            activeAiIdRef.current = null;
            return;
          } else if (eventType === "result") {
            if (data.sessionPatch) {
              setAgentSession((current) => ({ ...current, ...data.sessionPatch }));
            }

            const bundle = data.recommendation as AgentRecommendationBundle | undefined;
            setLatestBundle(bundle);
            const primaryRec = data.primaryRecommendation as CocktailRecommendation | undefined;
            const altRecs = (data.alternatives as CocktailRecommendation[]) ?? [];
            setLatestAlternatives(primaryRec ? [primaryRec, ...altRecs] : altRecs);
            setOwnedIngredients(data.toolResults?.ownedIngredients ?? []);
            setUnknownIngredients([]);
            setTrustSignals((data.trustSignals as TrustSignal[]) ?? []);
            setCitations((data.citations as Citation[]) ?? []);

            const aiText = buildAiResponseText(data);
            const clarification = data.clarification as { question: string; options: string[] } | undefined;

            setChatMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiId
                  ? { ...msg, text: aiText, thinkingSteps: [...thinkingSteps], recommendation: bundle, clarification, isPending: false }
                  : msg
              )
            );
            setIsStreaming(false);
            activeAiIdRef.current = null;
            return;
          } else if (eventType === "error") {
            throw new Error(data.message || "Stream error");
          }
        }

        if (done) break;
      }

      throw new Error("Stream ended without result");
    } catch {
      /* --- local fallback --- */
      const parsed = await parseAgentRequestWithFallback(text);

      if (parsed.safety.shouldAvoidAlcohol) {
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiId
              ? { ...msg, text: parsed.safety.message, thinkingSteps, safetyMessage: parsed.safety.message, isPending: false }
              : msg
          )
        );
        setIsStreaming(false);
        return;
      }

      const result = buildAgentRecommendation({
        cocktails,
        preference: parsed.preference
      });
      const line = buildBartenderOneLiner({
        preference: parsed.preference,
        cocktail: result.recommendation.cocktail,
        missingIngredients: result.recommendation.missingIngredients
      });

      const alternatives = rankForExploration({
        cocktails,
        mood: moodFromPreference(parsed.preference),
        preferredStrength: strengthFromPreference(parsed.preference.strengthPreference),
        tasteProfile: tasteFromPreference(parsed.preference),
        semanticQuery: text
      })
        .filter((r) => r.cocktail.id !== result.recommendation.cocktail.id)
        .slice(0, 2);

      const fallbackBundle = buildLocalFallbackBundle(
        result.recommendation,
        alternatives,
        result.ownedIngredients
      );

      setOwnedIngredients(result.ownedIngredients);
      setUnknownIngredients([]);
      setLatestBundle(fallbackBundle);
      setLatestAlternatives([result.recommendation, ...alternatives]);
      setAgentSession((current) => ({
        ...current,
        preferredFlavors: Array.from(new Set([...current.preferredFlavors, ...parsed.preference.flavorPreferences])),
        dislikedFlavors: Array.from(new Set([...current.dislikedFlavors, ...parsed.preference.dislikedFlavors])),
        preferredStrength: parsed.preference.strengthPreference === "unknown" ? current.preferredStrength : parsed.preference.strengthPreference,
        availableIngredients: Array.from(new Set([...current.availableIngredients, ...parsed.preference.availableIngredients])),
        lastRecommendationIds: [
          result.recommendation.cocktail.id,
          ...current.lastRecommendationIds.filter((id) => id !== result.recommendation.cocktail.id)
        ].slice(0, 5)
      }));

      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiId
            ? {
                ...msg,
                text: line,
                thinkingSteps: [
                  ...thinkingSteps,
                  { step: "⚠️ 本地兜底", detail: "后端 Agent 不可用，已使用本地匹配引擎" }
                ],
                recommendation: fallbackBundle,
                isPending: false
              }
            : msg
        )
      );
      setIsStreaming(false);
      activeAiIdRef.current = null;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Chat: recommendation selection                                     */
  /* ------------------------------------------------------------------ */

  // “换一杯”视为对当前推荐的拒绝：写入会话记忆，并立即就地换成下一个候选
  function rejectCurrentRecommendation() {
    const rejectedId = agentRecommendation?.primary.id ?? recommendation?.cocktail.id;
    const rejectedIds = new Set(agentSession.rejectedRecommendationIds);
    if (rejectedId) {
      rejectedIds.add(rejectedId);
      setAgentSession((current) => ({
        ...current,
        rejectedRecommendationIds: Array.from(
          new Set([...current.rejectedRecommendationIds, rejectedId])
        ).slice(-10)
      }));
    }

    const nextRec = alternativePool.find((r) => !rejectedIds.has(r.cocktail.id));
    if (!nextRec) {
      // 候选用尽，回到来源页重新选择
      navigateTo(resultBackScreen);
      return;
    }

    setAlternativePool((pool) => pool.filter((r) => r.cocktail.id !== nextRec.cocktail.id));
    setRecommendation(nextRec);
    setAgentRecommendation(undefined);
    setBartenderLine(nextRec.reason);
    setTrustSignals([]);
    setCitations([]);
    requestAnimationFrame(() => {
      const el = document.querySelector(".screen");
      if (el) el.scrollTop = 0;
    });
  }

  function openChatRecommendation(index: number) {
    if (!latestBundle) return;

    const candidates = [latestBundle.primary, ...latestBundle.alternatives];
    const candidate = candidates[index];
    if (!candidate) return;

    if (index === 0) {
      setAgentRecommendation(latestBundle);
      const primaryRec = latestAlternatives.find(
        (r) => r.cocktail.id === candidate.id
      );
      if (primaryRec) {
        setRecommendation(primaryRec);
        setOwnedIngredients(primaryRec.ownedIngredients);
      }
      setAlternativePool(latestAlternatives.filter((r) => r.cocktail.id !== candidate.id));
      setResultBackScreen("chat");
      navigateTo("result");
      return;
    }

    const match = latestAlternatives.find(
      (r) => r.cocktail.id === candidate.id
    );
    if (match) {
      setRecommendation(match);
      setAgentRecommendation(undefined);
      setBartenderLine(match.reason);
      setOwnedIngredients(match.ownedIngredients);
      setAlternativePool(latestAlternatives.filter((r) => r.cocktail.id !== candidate.id));
      setTrustSignals([{ type: "local_classic", label: "本地经典酒单" }]);
      setCitations([]);
      setResultBackScreen("chat");
      navigateTo("result");
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Menu / follow / share                                              */
  /* ------------------------------------------------------------------ */

  function showMenuCocktail(rec: CocktailRecommendation) {
    const owned = rec.cocktail.ingredients
      .map((ingredient) => ingredient.ingredientId)
      .filter((id) => userProfile.barIngredientIds.includes(id));
    setOwnedIngredients(owned);
    setUnknownIngredients([]);
    setBartenderLine("");
    setAgentRecommendation(undefined);
    setTrustSignals([{ type: "local_classic", label: "本地经典酒单", description: "来自当前维护的酒单内容。" }]);
    setCitations([]);
    setRecommendation(rec);
    // 酒单是用户自选，不提供“换一杯”
    setAlternativePool([]);
    setResultBackScreen("menu");
    navigateTo("result");
  }

  function startFollowAlong() {
    setActiveStep(0);
    setPhotoUrl("");
    setPhotoError("");
    setIsPhotoProcessing(false);
    setCaptionStyle("casual_share");
    navigateTo("follow");
  }

  async function handlePhotoSelected(file: File) {
    if (file.type && !file.type.startsWith("image/")) {
      setPhotoError("这个文件不是图片，请重新选择一张照片。");
      return;
    }

    setIsPhotoProcessing(true);
    setPhotoError("");

    try {
      const preview = await readPhotoAsDataUrl(file);
      setPhotoUrl(preview);
      setCaptionStyle("casual_share");
      navigateTo("share");
    } catch {
      setPhotoError("照片读取失败，请重新选择，或先换一张尺寸较小的照片。");
    } finally {
      setIsPhotoProcessing(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <main className="app-shell">
      {/*
        THESIS: 一张会回应用户的私人酒保工作台，拒绝手机样机与同构卡片堆叠。
        OWN-WORLD: 雾白工作台、墨绿服务托盘、酒液绿点色、细线酒谱与大幅留白。
        STORY: 用户先被酒保接住，再从对话、探索或材料自然进入一杯可执行的酒。
        FIRST VIEWPORT: 左侧文字与入口形成服务邀请，酒保杯作为中央偏右的活体主角，主行动紧邻杯子。
        FORM: 工作台与酒谱目录的混合结构，方向种子 e9d6962b。
        FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
      */}
      <div className="phone-frame">
        <div className={`top-tool-cluster ${screen === "home" ? "home-tools" : "context-tools"}`}>
          <FeedbackEntry context="global" />
          <ConnectionStatus />
        </div>
        {screen === "home" && (
          <Home
            onChat={() => navigateTo("chat")}
            onExplore={() => navigateTo("explore")}
            onIngredients={() => { setIngredientPurpose("recommend"); navigateTo("ingredients"); }}
          />
        )}
        {screen === "chat" && (
          <ChatPanel
            messages={chatMessages}
            isThinking={isStreaming}
            onBack={() => navigateTo("home")}
            onSubmit={handleChatSubmit}
            onSelectRecommendation={openChatRecommendation}
          />
        )}
        {screen === "explore" && (
          <ExplorePanel onBack={() => navigateTo("home")} onComplete={showExplorationResult} />
        )}
        {screen === "menu" && (
          <MenuView cocktails={cocktails} onBack={() => navigateTo("home")} onSelect={showMenuCocktail} />
        )}
        {screen === "atoms" && (
          <SvgAtomGallery onBack={() => navigateTo("home")} />
        )}
        {screen === "my" && (
          <MyBarView
            profile={userProfile}
            onManageIngredients={() => { setIngredientPurpose("manage"); navigateTo("ingredients"); }}
            onSelectCocktail={(item) => { showMenuCocktail(item); setResultBackScreen("my"); }}
            onClearHistory={() => setUserProfile((current) => ({ ...current, recentCocktailIds: [] }))}
          />
        )}
        {screen === "ingredients" && (
          <IngredientPanel
            isParsing={isParsing}
            initialSelected={ingredientPurpose === "manage" ? userProfile.barIngredientIds : undefined}
            saveLabel={ingredientPurpose === "manage" ? "保存到我的酒柜" : undefined}
            title={ingredientPurpose === "manage" ? "管理酒柜" : undefined}
            description={ingredientPurpose === "manage" ? "选择家里现有的酒和辅料" : undefined}
            backLabel={ingredientPurpose === "manage" ? "返回我的酒柜" : undefined}
            allowEmpty={ingredientPurpose === "manage"}
            mode={ingredientPurpose}
            onBack={() => navigateTo(ingredientPurpose === "manage" ? "my" : "home")}
            onComplete={showIngredientResult}
          />
        )}
        {screen === "result" && recommendation && (
          <ResultView
            recommendation={recommendation}
            ownedIngredientIds={ownedIngredients}
            ownedNames={ownedNames}
            unknownIngredients={unknownIngredients}
            bartenderLine={bartenderLine}
            agentRecommendation={agentRecommendation}
            trustSignals={trustSignals}
            citations={citations}
            onBack={() => navigateTo(resultBackScreen)}
            onSwapDrink={alternativePool.length > 0 ? rejectCurrentRecommendation : undefined}
            onTryAnother={startFollowAlong}
            isFavorite={userProfile.favoriteCocktailIds.includes(recommendation.cocktail.id)}
            onToggleFavorite={() => setUserProfile((current) => toggleFavoriteCocktail(current, recommendation.cocktail.id))}
          />
        )}
        {screen === "follow" && recommendation && (
          <FollowAlongView
            cocktail={recommendation.cocktail}
            activeStep={activeStep}
            onBack={() => navigateTo("result")}
            onStepChange={setActiveStep}
            onPhotoSelected={handlePhotoSelected}
            isPhotoProcessing={isPhotoProcessing}
            photoError={photoError}
          />
        )}
        {screen === "share" && recommendation && (
          <ShareCardView
            cocktail={recommendation.cocktail}
            photoUrl={photoUrl}
            captionStyle={captionStyle}
            onBack={() => navigateTo("follow")}
            onCaptionStyleChange={setCaptionStyle}
            onRetake={() => navigateTo("follow")}
          />
        )}
        {isBottomNavScreen(screen) && (
          <BottomNav
            active={screen === "menu" ? "menu" : screen === "atoms" ? "atoms" : screen === "my" ? "my" : "home"}
            onNavigate={(s: string) => navigateTo(s as Screen)}
          />
        )}
      </div>
      {screen === "home" && <CocktailCard cocktail={cocktails[5]} ambient />}
    </main>
  );
}
