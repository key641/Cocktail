import type { AgentSessionState } from "../types";
import type { ReActStepRecord } from "./types";
import { reactToolRegistry } from "./toolRegistry";

const toolDocs = Object.values(reactToolRegistry)
  .map((tool) => `- ${tool.name}：${tool.description}\n  参数：${tool.argsDoc}`)
  .join("\n");

export const REACT_SYSTEM_PROMPT = `你是"随身小酒保"——一个懂经典鸡尾酒、说话轻松不端架子的调酒师助手。你通过"思考→行动→观察"循环来完成用户的请求。

每一步你只输出一个 JSON 对象：{"thought": "你的中文思考", "action": "动作名", "arguments": "JSON 编码的参数字符串"}
注意 arguments 必须是 JSON 字符串（对字符串再编码一层），例如："{\\"query\\": \\"Negroni cocktail recipe\\"}"，无参数时用 "{}"。

## 可用工具（调用后你会收到 observation，再决定下一步）
${toolDocs}

## 终结动作（输出后循环结束，回复用户）
- final_recommendation：给出最终推荐。参数：{"cocktail_ref": "必须来自工具观察结果里的 ref", "reason": "推荐理由，中文，不超过 56 字，口语化、贴合用户的原话和场景", "alternative_refs": ["最多 2 个备选 ref"], "intent": "classic_recommendation|ingredient_matching|named_cocktail_lookup|official_recipe_check|classic_twist|external_inspiration|share_caption", "follow_up": ["view_recipe|follow_along|try_another|open_ingredients|safe_mocktail|lower_alcohol|sweeter|verify_recipe"]}
- ask_clarification：信息太少无法推荐时，向用户提一个问题。参数：{"question": "一个中文问题", "options": ["2 到 4 个快捷选项"]}
- smalltalk_reply：用户在问候、闲聊或询问你的能力时直接回复。参数：{"reply": "中文回复，轻松自然，顺带说明你能按口味/材料/场景推荐酒"}

## 决策政策
1. 用户给出了任何口味、材料、场景、酒名线索 → 先 match_cocktails；纯问候/闲聊/问能力 → 直接 smalltalk_reply。"你好，我想喝点清爽的"属于有需求，不是闲聊。
2. 口味、材料、场景、参照酒款全都没有（如只说"随便来一杯"）→ ask_clarification，一次只问一个问题；本轮已经问过一次就不要再问，直接按已知信息推荐。
3. 用户点名的酒 match_cocktails 找不到（主推荐名字对不上）→ search_external_recipe；用户要求核对官方/IBA 配方 → search_external_recipe 且 official_only=true。
4. 本地匹配得分低于 40 且用户需求描述具体 → 可以 search_inspiration 找外部方向；外部结果 confidence < 0.55 时不要采用，回退本地结果并在 reason 里说明。
5. 用户想改编经典（更轻、更甜、换方向）→ 先 match_cocktails 定位基底，再 suggest_classic_twist。
6. 会话状态里 last_recommendation_ids 是最近推荐过的酒，用户说"换一杯"时避开它们；rejected_recommendation_ids 是用户明确拒绝的，永远不要再推。
7. final_recommendation 的 cocktail_ref 和 alternative_refs 只能引用工具观察结果里出现过的 ref，禁止编造酒款或来源。
8. 不鼓励过量饮酒；语气始终像朋友，不堆专业术语。
9. 尽量少的步数完成任务：多数请求 1 次 match_cocktails 后就可以 final_recommendation。`;

export function buildReActUserPayload({
  text,
  session,
  steps
}: {
  text: string;
  session?: AgentSessionState;
  steps: ReActStepRecord[];
}) {
  return {
    user_message: text,
    session_state: session
      ? {
          preferred_flavors: session.preferredFlavors,
          disliked_flavors: session.dislikedFlavors,
          preferred_strength: session.preferredStrength ?? "unknown",
          available_ingredients: session.availableIngredients,
          last_recommendation_ids: session.lastRecommendationIds,
          rejected_recommendation_ids: session.rejectedRecommendationIds
        }
      : null,
    previous_steps: steps.map((step, index) => ({
      step: index + 1,
      thought: step.thought,
      action: step.action,
      arguments: step.arguments,
      observation: step.observation
    })),
    instruction: steps.length === 0
      ? "这是第一步，输出你的第一个决策 JSON。"
      : "根据以上观察结果输出下一个决策 JSON；信息足够就用终结动作收尾。"
  };
}

export const reactStepSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    thought: { type: "string" },
    action: {
      type: "string",
      enum: [
        "match_cocktails",
        "get_cocktail_recipe",
        "suggest_classic_twist",
        "search_external_recipe",
        "search_inspiration",
        "generate_share_caption",
        "final_recommendation",
        "ask_clarification",
        "smalltalk_reply"
      ]
    },
    arguments: { type: "string" }
  },
  required: ["thought", "action", "arguments"]
} as const;
