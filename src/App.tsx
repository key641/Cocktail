import { useMemo, useState } from "react";
import { ChatPanel, type ChatMessage, type ThinkingStep } from "./components/ChatPanel";
import { CocktailCard } from "./components/CocktailCard";
import { ExplorePanel, type ExploreChoices } from "./components/ExplorePanel";
import { FollowAlongView } from "./components/FollowAlongView";
import { Home } from "./components/Home";
import { IngredientPanel } from "./components/IngredientPanel";
import { MenuView } from "./components/MenuView";
import { ResultView } from "./components/ResultView";
import { ShareCardView } from "./components/ShareCardView";
import { cocktails } from "./data/cocktails";
import { getIngredientName } from "./data/ingredients";
import { buildAgentRecommendation } from "./domain/agentFlow";
import { buildBartenderOneLiner, buildUnderstandingSummary, type UnderstandingSummary } from "./domain/agentNarrative";
import { parseIngredientsLocally } from "./domain/ingredientParser";
import { parseUserPreference, type ParsedPreference } from "./domain/preferenceParser";
import { recommendByIngredients, recommendForExploration } from "./domain/recommendation";
import { checkAlcoholSafety, type AlcoholSafetyResult } from "./domain/safety";
import type { CaptionStyle } from "./domain/captionGenerator";
import type { AgentRecommendationBundle, AgentSessionState, Citation, TrustSignal } from "./domain/agentTypes";
import type { CocktailRecommendation, TasteProfile } from "./domain/types";

type Screen = "home" | "chat" | "explore" | "ingredients" | "menu" | "result" | "follow" | "share";

const defaultTasteProfile: TasteProfile = {
  sweet: 2, sour: 3, bitter: 1, fresh: 4, strong: 2, fruity: 2, herbal: 1, bubbly: 0
};

let messageIdCounter = 0;
function nextMessageId() {
  return `msg-${++messageIdCounter}`;
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

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
  const [resultBackScreen, setResultBackScreen] = useState<Screen>("home");

  /* --- result-screen state (shared by all paths) --- */
  const [recommendation, setRecommendation] = useState<CocktailRecommendation | null>(null);
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
  const [agentSession, setAgentSession] = useState<AgentSessionState>({
    preferredFlavors: [],
    dislikedFlavors: [],
    availableIngredients: [],
    lastRecommendationIds: [],
    rejectedRecommendationIds: []
  });

  /* --- follow / share --- */
  const [activeStep, setActiveStep] = useState(0);
  const [photoUrl, setPhotoUrl] = useState("");
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>("casual_share");

  const ownedNames = useMemo(() => ownedIngredients.map(getIngredientName), [ownedIngredients]);

  /* ------------------------------------------------------------------ */
  /*  Navigation handlers                                                */
  /* ------------------------------------------------------------------ */

  function showExplorationResult(choices: ExploreChoices) {
    const result = recommendForExploration({
      cocktails,
      mood: choices.mood,
      preferredStrength: choices.strength,
      tasteProfile: choices.tasteProfile,
      seed: choices.seed
    });
    setOwnedIngredients([]);
    setUnknownIngredients([]);
    setAgentRecommendation(undefined);
    setTrustSignals([]);
    setCitations([]);
    setRecommendation(result);
    setResultBackScreen("home");
    setScreen("result");
  }

  async function showIngredientResult(selected: string[], freeText: string, tasteProfile: TasteProfile) {
    setIsParsing(true);
    const parsed = await parseIngredientsWithFallback(freeText);
    const merged = Array.from(new Set([...selected, ...parsed.ingredients]));
    const [result] = recommendByIngredients({
      cocktails,
      ownedIngredientIds: merged,
      tasteProfile
    });
    setOwnedIngredients(merged);
    setUnknownIngredients(parsed.unknown);
    setAgentRecommendation(undefined);
    setTrustSignals([]);
    setCitations([]);
    setRecommendation(result);
    setIsParsing(false);
    setResultBackScreen("home");
    setScreen("result");
  }

  /* ------------------------------------------------------------------ */
  /*  Chat: SSE-streaming handler                                        */
  /* ------------------------------------------------------------------ */


function buildLocalFallbackBundle(result: ReturnType<typeof buildAgentRecommendation>): AgentRecommendationBundle {
  const cocktail = result.recommendation.cocktail;
  const primary: AgentRecommendationBundle["primary"] = {
    id: cocktail.id,
    name: cocktail.name,
    englishName: cocktail.englishName,
    recipeMode: "local",
    source: "local_classic",
    confidence: result.recommendation.score / 100,
    tags: cocktail.tags,
    reason: result.recommendation.reason,
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
  return {
    primary,
    alternatives: [],
    reason: result.recommendation.reason,
    executableInfo: {
      ownedIngredients: result.ownedIngredients,
      missingIngredients: result.recommendation.missingIngredients,
      difficulty: "normal"
    }
  };
}

  async function handleChatSubmit(text: string) {
    const userId = nextMessageId();
    const aiId = nextMessageId();

    setChatMessages((prev) => [
      ...prev,
      { id: userId, role: "user", text }
    ]);
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
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7);
          } else if (line.startsWith("data: ")) {
            let data: any;
            try {
              data = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            if (eventType === "trace") {
              thinkingSteps.push(data);
            } else if (eventType === "safety_blocked") {
              setChatMessages((prev) => [
                ...prev,
                {
                  id: aiId,
                  role: "ai",
                  text: data.message || "为了你的健康，我不建议你饮酒哦。要不要试试无酒精版本？",
                  thinkingSteps: [...thinkingSteps],
                  safetyMessage: data.message
                }
              ]);
              setIsStreaming(false);
              return;
            } else if (eventType === "result") {
              if (data.sessionPatch) {
                setAgentSession((current) => ({ ...current, ...data.sessionPatch }));
              }

              const bundle = data.recommendation as AgentRecommendationBundle | undefined;
              setLatestBundle(bundle);
              setLatestAlternatives((data.alternatives as CocktailRecommendation[]) ?? []);
              setOwnedIngredients(data.toolResults?.ownedIngredients ?? []);
              setUnknownIngredients([]);

              const aiText = buildAiResponseText(data);

              setChatMessages((prev) => [
                ...prev,
                {
                  id: aiId,
                  role: "ai",
                  text: aiText,
                  thinkingSteps: [...thinkingSteps],
                  recommendation: bundle
                }
              ]);
              setIsStreaming(false);
              return;
            } else if (eventType === "error") {
              throw new Error(data.message || "Stream error");
            }
          }
        }
      }

      throw new Error("Stream ended without result");
    } catch {
      /* --- local fallback --- */
      const parsed = await parseAgentRequestWithFallback(text);

      if (parsed.safety.shouldAvoidAlcohol) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: aiId,
            role: "ai",
            text: parsed.safety.message,
            thinkingSteps,
            safetyMessage: parsed.safety.message
          }
        ]);
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

      setOwnedIngredients(result.ownedIngredients);
      setUnknownIngredients([]);
      setLatestBundle(undefined);
      setLatestAlternatives([]);

      setChatMessages((prev) => [
        ...prev,
        {
          id: aiId,
          role: "ai",
          text: line,
          thinkingSteps: [
            ...thinkingSteps,
            { step: "本地兜底", detail: "后端 Agent 不可用，已使用本地匹配引擎" }
          ]
        }
      ]);
      setIsStreaming(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Chat: recommendation selection                                     */
  /* ------------------------------------------------------------------ */

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
      setTrustSignals([]);
      setCitations([]);
      setResultBackScreen("chat");
      setScreen("result");
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
      setTrustSignals([]);
      setCitations([]);
      setResultBackScreen("chat");
      setScreen("result");
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Menu / follow / share                                              */
  /* ------------------------------------------------------------------ */

  function showMenuCocktail(rec: CocktailRecommendation) {
    setOwnedIngredients([]);
    setUnknownIngredients([]);
    setBartenderLine("");
    setAgentRecommendation(undefined);
    setTrustSignals([]);
    setCitations([]);
    setRecommendation(rec);
    setResultBackScreen("home");
    setScreen("result");
  }

  function startFollowAlong() {
    setActiveStep(0);
    setPhotoUrl("");
    setCaptionStyle("casual_share");
    setScreen("follow");
  }

  function handlePhotoSelected(file: File) {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(URL.createObjectURL(file));
    setCaptionStyle("casual_share");
    setScreen("share");
  }

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <main className="app-shell">
      <div className="phone-frame">
        {screen === "home" && (
          <Home
            onChat={() => setScreen("chat")}
            onExplore={() => setScreen("explore")}
            onIngredients={() => setScreen("ingredients")}
            onMenu={() => setScreen("menu")}
          />
        )}
        {screen === "chat" && (
          <ChatPanel
            messages={chatMessages}
            isThinking={isStreaming}
            onBack={() => setScreen("home")}
            onSubmit={handleChatSubmit}
            onSelectRecommendation={openChatRecommendation}
          />
        )}
        {screen === "explore" && (
          <ExplorePanel onBack={() => setScreen("home")} onComplete={showExplorationResult} />
        )}
        {screen === "menu" && (
          <MenuView cocktails={cocktails} onBack={() => setScreen("home")} onSelect={showMenuCocktail} />
        )}
        {screen === "ingredients" && (
          <IngredientPanel
            isParsing={isParsing}
            onBack={() => setScreen("home")}
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
            onBack={() => setScreen(resultBackScreen)}
            onTryAnother={startFollowAlong}
          />
        )}
        {screen === "follow" && recommendation && (
          <FollowAlongView
            cocktail={recommendation.cocktail}
            activeStep={activeStep}
            onBack={() => setScreen("result")}
            onStepChange={setActiveStep}
            onPhotoSelected={handlePhotoSelected}
          />
        )}
        {screen === "share" && recommendation && (
          <ShareCardView
            cocktail={recommendation.cocktail}
            photoUrl={photoUrl}
            captionStyle={captionStyle}
            onBack={() => setScreen("follow")}
            onCaptionStyleChange={setCaptionStyle}
            onRetake={() => setScreen("follow")}
          />
        )}
      </div>
      {screen === "home" && <CocktailCard cocktail={cocktails[5]} ambient />}
    </main>
  );
}
