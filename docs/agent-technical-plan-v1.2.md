# AI 酒保 Agent 技术方案 v1.2

## 0. 当前实现状态

### 已完成

- `/api/agent/chat` 主入口已存在，并已支持传入 `session`。
- `runBartenderAgent` 已完成轻量函数式编排。
- `parseRequestForAgent` 已支持 OpenAI JSON 解析，并可降级到本地 parser。
- `searchCocktailRecipeTool` 已通过 OpenAI Responses API `web_search` 接入外部配方查证。
- `searchCocktailInspirationTool` 已新增，用于低置信度时外部灵感检索。
- `routeAgentIntent` 已新增，支持本地推荐、材料匹配、未知酒款、官方查证、classic twist、外部灵感等意图。
- `evaluateRecommendationConfidence` 已新增，支持本地推荐低置信度判断。
- `AgentRecommendationBundle`、`AgentDrinkCandidate`、`TrustSignal`、`Citation`、`AgentSessionState` 等标准类型已新增。
- 前端已新增 `src/domain/agentTypes.ts`，用于消费 Agent 标准结构。
- 结果页已支持外部酒款、信任标签和 citation 展示。
- 测试已覆盖本地推荐、未知酒款外部查证、IBA-only 查证、基础安全拦截等路径。

### 部分完成

- `AgentSessionState` 已可传递和返回，但偏好覆盖、否定移除、材料移除等复杂合并规则还未完整实现。
- `external_inspiration` 路由和工具已存在，但前端还没有专门的灵感候选 UI。
- `trustSignals` 已接入，但 `语义匹配` 这类新信任标签尚未实现。
- 外部酒款可以在结果页展示材料和步骤，但尚未完整接入跟做页、分享页的外部 recipe 模式。
- `debug` 字段目前仍可能在返回中出现，后续需要按环境变量控制，仅开发环境返回。

### 未完成

- `CocktailSemanticProfile` 未实现。
- `SemanticPreference`、`semanticQuery`、`unmatchedDescriptors` 未实现。
- `tagScore / semanticScore / source` 三分制匹配尚未实现；当前只有基础 confidence。
- 本地 semantic rerank 未实现。
- 工具注册表 `agentToolRegistry` 未实现。
- OpenAI Agents SDK 未接入。
- 长期记忆、用户画像、账号体系未实现。

## 1. 技术目标

基于《AI 酒保 Agent 产品方案 v1.2》，下一阶段 Agent 的技术目标是：

> 在不推倒现有推荐系统的前提下，把当前“AI 辅助推荐”升级为“可编排、可查证、可扩展的线上酒保 Agent”。

核心技术原则：

- 优先复用现有能力：本地 30 款经典酒库、推荐算法、材料解析、安全规则、SVG visual spec、OpenAI JSON client、web search 工具。
- 不让 LLM 直接编配方：LLM 负责理解、路由、表达和结构化输出；配方优先来自本地酒库或外部查证。
- 先做轻量 Agent 编排层，不急着引入复杂多 Agent、向量库或 GraphRAG。
- 所有 Agent 输出都必须结构化，方便前端稳定渲染。
- 保留未来迁移到 OpenAI Agents SDK 或更完整 tool orchestration 的空间。

## 2. 当前基础

当前项目已经具备以下 Agent 相关能力：

- `/api/agent/chat`：前端对话入口。
- `runBartenderAgent`：基础 Agent 编排函数。
- `parseRequestForAgent`：使用本地规则 + GPT 解析用户偏好。
- `matchCocktailsTool`：从本地酒库推荐主酒和备选。
- `getCocktailRecipeTool`：读取本地配方、材料和步骤。
- `suggestClassicTwistTool`：基于经典结构做轻量 twist。
- `getVisualSpecTool`：获取 SVG 酒图参数。
- `generateShareCaptionTool`：生成分享文案。
- `searchCocktailRecipeTool`：通过 OpenAI Responses API 的 `web_search` 查证外部配方。
- 无 `OPENAI_API_KEY` 时可以降级到本地能力。

因此下一阶段不需要重做技术底座，而是补齐：

- Agent 意图路由
- 工具调用决策
- 外部查证接入主对话流
- 标准化返回结构
- 低置信度触发外部灵感检索
- 前端可展示的来源与信任标签

## 3. 推荐架构

### 3.1 总体流程

```text
User Text
  -> Safety Guard
  -> Preference Parser
  -> Intent Router
  -> Local Cocktail Matcher
  -> Confidence Evaluator
  -> Tool Orchestrator
       -> Local Recipe Tool
       -> Twist Tool
       -> External Recipe Search Tool
       -> External Inspiration Search Tool
  -> Response Composer
  -> Structured Agent Response
  -> Mobile UI Rendering
```

### 3.2 Agent 分层

建议将 Agent 拆为 5 层：

1. **理解层**  
   解析用户输入，得到口味、材料、场景、强度、请求类型、安全风险。

2. **路由层**  
   判断用户是在要经典推荐、材料匹配、点名酒款、官方查证、classic twist、外部灵感，还是分享文案。

3. **工具层**  
   调用本地推荐、本地配方、外部查证、twist、visual spec、caption 等工具。

4. **可信度层**  
   判断本地结果是否足够贴合，是否需要联网查证或标注不确定。

5. **表达层**  
   输出固定结构：主推荐、两个备选、推荐理由、信任标签、来源引用、下一步动作。

## 4. 核心接口设计

### 4.1 `/api/agent/chat`

继续作为主对话入口，不新增复杂前端入口。

请求：

```ts
type AgentChatRequest = {
  text: string;
  session?: AgentSessionState;
};
```

返回：

```ts
type AgentChatResponse = {
  status: "ok" | "safety_blocked" | "needs_confirmation";
  agentMode: "local_tools" | "openai_responses_tools" | "openai_agents_sdk";
  intent: AgentIntent;
  message: string;
  bartenderJudgement: string;
  recommendation?: AgentRecommendationBundle;
  trustSignals: TrustSignal[];
  citations: Citation[];
  followUpActions: AgentAction[];
  sessionPatch?: Partial<AgentSessionState>;
  debug?: AgentDebugInfo;
};
```

`agentMode` 约定：

- `local_tools`：只使用本地 parser、规则和酒库。
- `openai_responses_tools`：使用 OpenAI Responses API 做结构化理解或 web_search 查证。
- `openai_agents_sdk`：未来迁移到 OpenAI Agents SDK 后使用；当前阶段不作为默认实现。

`debug` 仅允许开发环境返回，生产环境默认不返回，避免暴露内部提示词、工具参数或模型调用细节。

### 4.2 推荐结果结构

```ts
type AgentRecommendationBundle = {
  primary: AgentDrinkCandidate;
  alternatives: AgentDrinkCandidate[];
  reason: string;
  executableInfo: {
    ownedIngredients: string[];
    missingIngredients: string[];
    difficulty: "easy" | "normal" | "professional";
    estimatedMinutes?: number;
  };
};
```

### 4.3 酒款候选结构

```ts
type AgentDrinkCandidate = {
  id: string;
  name: string;
  englishName?: string;
  recipeMode: "local" | "external";
  source: "local_classic" | "external_verified" | "external_inspiration" | "classic_twist";
  sourceType?: "iba_official" | "reputable_site" | "web_unverified";
  confidence: number;
  tags: string[];
  reason: string;
  recipe?: AgentRecipe;
  visualSpec?: CocktailVisualSpec;
  displayVisualFallback?: {
    glass?: string;
    drinkColor?: string;
    garnish?: string[];
  };
};
```

外部酒款需要能进入结果页和跟做页，因此不能只返回文本。外部查证候选至少需要满足：

- `recipeMode="external"`。
- `recipe.ingredients` 使用自由文本材料名和用量，不要求映射到本地 ingredient id。
- `recipe.steps` 必须是可执行步骤，不能只是一段简介。
- `glass`、`garnish`、`sourceType`、`citations` 尽量从查证结果中带出。
- 如果没有本地 SVG 映射，前端使用 `displayVisualFallback` 渲染通用杯型或占位酒图。

本地酒款继续使用 `recipeMode="local"`，并优先通过本地 `Cocktail` 数据和 `CocktailVisualSpec` 渲染。

### 4.4 信任标签

```ts
type TrustSignal = {
  type:
    | "local_classic"
    | "iba_source"
    | "external_source"
    | "classic_twist"
    | "not_official"
    | "uncertain";
  label: string;
  description?: string;
};
```

信任标签需要保持少而清晰：

- `local_classic`：来自本地经典酒库。
- `iba_source`：外部来源为 IBA 官方。
- `external_source`：来自非 IBA 但可信的外部来源。
- `classic_twist`：基于经典结构的小幅改编。
- `not_official`：明确不是官方配方。
- `uncertain`：来源不足或可信度低，只能作为灵感方向。

避免使用含义模糊的 `verified`，因为“已查证”需要和具体来源类型绑定。

### 4.5 Citation

```ts
type Citation = {
  title?: string;
  url: string;
  sourceType: "iba_official" | "reputable_site" | "web_unverified";
};
```

所有外部查证结果只要引用了网页来源，前端都必须展示可点击 citation。
前端不能通过 LLM 文案判断来源状态，只能依赖 `trustSignals`、`sourceType` 和 `citations` 这些结构化字段。

## 5. 意图路由策略

建议新增 `routeAgentIntent`，输入为 `ParsedPreference + userText + sessionState`，输出为：

```ts
type AgentIntent =
  | "classic_recommendation"
  | "ingredient_matching"
  | "named_cocktail_lookup"
  | "official_recipe_check"
  | "classic_twist"
  | "external_inspiration"
  | "share_caption"
  | "safe_mocktail";
```

路由规则：

- 用户提到明确酒名，先查本地酒库；本地没有则进入 `named_cocktail_lookup`。
- 用户提到“官方、标准、正宗、IBA”等词，进入 `official_recipe_check`。
- 用户说“像 X 但更 Y”，进入 `classic_twist`。
- 用户只有口味和场景，优先走 `classic_recommendation`。
- 用户列出家里材料，走 `ingredient_matching`。
- 用户描述本地酒库薄弱方向，如烟熏、咸味、茶感、热饮、无酒精，走本地匹配后再由置信度层决定是否进入 `external_inspiration`。
- 安全风险优先级最高，命中后直接返回 `safe_mocktail` 或安全提示。

## 6. 工具编排策略

### 6.1 本地优先

默认路径：

```text
parse -> safety -> local match -> recipe -> visual spec -> response
```

适用：

- 普通首页对话
- 本地酒库可覆盖的经典推荐
- 材料匹配
- 已有本地配方的跟做

### 6.2 外部配方查证

触发：

- 点名酒款不在本地库
- 用户要求官方/标准配方
- 用户点击“查证配方”

调用：

```ts
searchCocktailRecipeTool({
  query,
  officialOnly,
  client
})
```

规则：

- 只有当用户明确要求 IBA、官方或标准配方时，才启用 `officialOnly=true` 并限定 IBA 域名。
- 普通外部查证不强制 IBA，因为很多现代经典不在 IBA 酒单中。
- 非官方查证优先可信调酒网站，并通过 `sourceType` 标注来源等级。
- 查证失败时不编配方，返回相近本地经典酒替代。
- 外部配方可以作为临时候选进入结果页和跟做页，但必须标注 `external_verified`。

### 6.3 外部灵感检索

建议在现有 `searchCocktailRecipeTool` 基础上新增 `searchCocktailInspirationTool`。

用途：

- 本地酒库无法覆盖用户想要的“感觉”。
- 需要找经典或现代经典方向，而不是查某个确定酒名。

返回：

```ts
type ExternalInspirationResult = {
  status: "found" | "unavailable" | "failed";
  candidates: AgentDrinkCandidate[];
  notes: string;
  citations: Citation[];
};
```

约束：

- 候选最多 3 个。
- 不直接生成完全原创配方。
- 只允许返回经典酒、现代经典、有来源的知名配方，或明确标注为“灵感方向”的候选。
- 来源不够可靠时只标为 `external_inspiration`，不进入“标准配方”表达，也不进入跟做页的标准配方流程。
- 如果外部灵感候选无法提供可靠材料和步骤，只能展示为方向建议，并提供相近本地经典酒作为可执行替代。

## 7. 本地置信度评估

建议新增 `evaluateRecommendationConfidence`。

输出：

```ts
type RecommendationConfidence = {
  score: number;
  level: "high" | "medium" | "low";
  reasons: string[];
  shouldSearchExternal: boolean;
};
```

建议规则：

- 本地最高候选口味匹配明显，且无安全/偏好冲突：`high`。
- 本地可推荐，但缺少部分材料或口味不完全贴合：`medium`。
- 用户明确需求本地标签无法覆盖，或最高候选与用户禁忌冲突：`low`。

低置信度触发外部检索的典型信号：

- 用户要求烟熏、咸味、茶感、热饮、无酒精等当前酒库弱覆盖方向。
- 用户说“都不太像”或连续换一杯。
- 最高候选包含用户不喜欢的风味。
- 所有候选都缺少关键材料。

## 7.1 本地语义匹配层

> 状态：未实施。以下为下一阶段设计方案。

除了结构化标签和 taste profile，Agent 需要支持语义描述匹配，用来处理“冬天感、雨天、松弛、像甜品但不腻、海边夜晚”这类不适合全部枚举成标签的表达。

### 数据结构

建议为本地酒款补充轻量语义字段：

```ts
type CocktailSemanticProfile = {
  cocktailId: string;
  semanticDescription: string;
  semanticKeywords: string[];
};
```

第一版可以独立放在 `cocktailSemanticProfiles` 中，不直接污染核心 `Cocktail` 数据。后续如果稳定，再合并进知识库。

示例：

```ts
{
  cocktailId: "old-fashioned",
  semanticDescription: "适合夜晚、慢饮、安静、成熟、木质感、冬天、独处、威士忌感",
  semanticKeywords: ["夜晚", "慢饮", "成熟", "木质", "冬天", "独处"]
}
```

### Query 表达

用户输入解析后，除了结构化 `ParsedPreference`，还应保留：

```ts
type SemanticPreference = {
  semanticQuery: string;
  unmatchedDescriptors: string[];
};
```

- `semanticQuery` 保留用户没有被标签覆盖的感觉描述。
- `unmatchedDescriptors` 记录暂时无法映射到正式标签的关键词或短语。

### 匹配策略

推荐决策拆成三个分数：

```ts
type MatchConfidence = {
  tagScore: number;
  semanticScore: number;
  source: "tag" | "semantic" | "external";
  shouldSearchExternal: boolean;
};
```

第一版不强制引入向量库，可以先用以下顺序实现：

1. 标签 / taste profile 召回和排序。
2. 本地 `semanticKeywords` 命中加权。
3. 如果接入 OpenAI，可让模型在本地候选内做 semantic rerank，但必须只返回候选 id，不允许生成新配方。
4. 如果 `tagScore` 和 `semanticScore` 都低，再进入 `searchCocktailInspirationTool`。

### 决策规则

- `tagScore` 高：本地标签推荐，标注 `经典酒库`。
- `tagScore` 中，`semanticScore` 高：本地语义推荐，标注 `语义匹配`。
- `tagScore` 低，`semanticScore` 低：外部灵感检索。
- 用户明确点名本地没有的酒：外部配方查证，不走语义灵感。
- 用户明确问官方/IBA：外部官方查证优先。

### 演进规则

如果某类 `unmatchedDescriptors` 高频出现，例如“烟熏、茶感、热饮、无酒精仪式感”，再将它升级为正式标签或 taste profile 维度。标签体系应从真实用户表达中生长，而不是一开始无限扩张。

## 8. 会话记忆

下一阶段只做轻量会话记忆，不做长期画像和账号体系。

```ts
type AgentSessionState = {
  preferredFlavors: string[];
  dislikedFlavors: string[];
  preferredStrength?: "low" | "medium" | "high";
  availableIngredients: string[];
  lastRecommendationIds: string[];
  rejectedRecommendationIds: string[];
};
```

使用方式：

- 前端在当前页面状态中保存 session。
- 每次调用 `/api/agent/chat` 时传入 session。
- 后端返回 `sessionPatch`。
- 刷新页面后可以丢失，不做持久化。

合并规则：

- 新输入优先于旧 session。
- 用户明确否定时，需要从 session 中移除对应偏好，例如“其实可以接受苦味”应弱化或移除 `dislikedFlavors=["bitter"]`。
- 用户补充材料时合并到 `availableIngredients`，用户明确说“没有了 / 用完了”时允许移除。
- `lastRecommendationIds` 和 `rejectedRecommendationIds` 只在当前会话有效，不进入长期存储。
- 安全风险不写入长期画像；安全判断每次都基于当前输入重新计算。

这样可以支持：

- “换一杯”时避开上一杯。
- 用户说“不想要苦的”后，本轮会话持续生效。
- 用户补充“我还有苏打水”后，后续推荐自动考虑。

## 9. 前端展示要求

前端不应直接展示原始工具结果，而应展示 Agent 的标准结构。

推荐页面需要支持：

- 一杯主推荐 + 两个备选。
- 信任标签：经典酒库、外部查证、来源 IBA、非官方 twist、待确认。
- citation 轻量展示：默认折叠，点击可打开来源链接。
- 下一步动作按钮：我来试试、更低酒精、换一杯、查证配方、看材料能不能做。

对话页需要支持：

- Agent 正在理解/查证的状态。
- 查证失败时的温和降级文案。
- 安全风险时直接展示安全提示，不进入酒精推荐。

## 10. 降级与失败处理

### 10.1 无 API key

行为：

- 用户理解使用本地 parser。
- 外部查证返回 `unavailable`。
- UI 显示“当前无法联网查证，但可以先基于本地经典酒库推荐”。

### 10.2 OpenAI 请求失败

行为：

- 保留本地推荐结果。
- 不阻断主流程。
- 对外部查证标注“暂时查证失败”。

### 10.3 查不到可靠来源

行为：

- 不生成标准配方。
- 返回“我没有找到足够可靠的来源”。
- 推荐相近本地经典酒。

### 10.4 安全风险

行为：

- 安全规则优先于所有推荐。
- 提供无酒精方向或建议避免饮酒。
- 不调用外部配方查证来绕过安全规则。

## 11. 扩展性设计

### 11.1 短期：轻量编排

继续使用当前函数式工具：

- 工具易测试
- 类型清晰
- 不引入额外框架成本
- 适合当前移动 Web demo

### 11.2 中期：工具注册表

新增 `agentToolRegistry`：

```ts
type AgentToolDefinition = {
  name: string;
  description: string;
  run: (input: unknown, context: AgentToolContext) => Promise<unknown> | unknown;
};
```

收益：

- 统一管理本地工具和外部工具。
- 方便未来切换到模型自主 tool calling。
- 方便记录工具调用日志。

### 11.3 长期：OpenAI Agents SDK

当出现以下需求时，再迁移到 Agents SDK：

- 多轮复杂任务规划。
- 多工具自主选择。
- 更复杂的 tracing/evaluation。
- 需要更标准化的 tool calling 生命周期。

迁移原则：

- 保留现有工具函数，不重写业务逻辑。
- 只替换 Agent 编排层。
- 前端 API 返回结构保持稳定。

## 12. 测试计划

### 12.1 单元测试

- 意图路由：点名本地酒、本地没有酒、官方配方、classic twist、普通推荐。
- 置信度评估：高匹配、中等匹配、低匹配、用户禁忌冲突。
- 外部查证：无 client、查证成功、查证失败、citation 去重。
- 外部查证低可信来源：不得进入标准配方展示，只能标注 `uncertain` 或返回本地替代。
- 会话记忆：补充材料、拒绝上一杯、偏好持续生效。
- 安全规则：开车、服药、未成年人等场景优先拦截。

### 12.2 集成测试

- `/api/agent/chat` 在无 API key 时仍返回本地推荐。
- 用户问本地没有的酒时，调用外部查证并返回 citation。
- 用户问“官方配方”时，启用 official-only 查证。
- 本地低置信度时，返回外部灵感候选或明确降级。

### 12.3 前端验收

- 对话页能展示主推荐和备选。
- 结果页能展示信任标签和来源链接。
- 查证失败不影响本地推荐。
- 手机端 390px 宽度无文字溢出。
- 安全提示不展示酒精推荐 CTA。

## 13. 实施顺序

### 阶段 1：标准化 Agent 返回

- 扩展 `BartenderAgentResponse`。
- 增加 `AgentRecommendationBundle`、`TrustSignal`、`Citation`、`AgentSessionState`。
- 前端改为消费标准结构。

### 阶段 2：意图路由与查证接入

- 新增 `routeAgentIntent`。
- 将 `searchCocktailRecipeTool` 接入 `/api/agent/chat` 主流程。
- 本地未命中酒款时进入外部查证。
- 官方配方请求启用 IBA 限定查证。

### 阶段 3：置信度与外部灵感

- 新增 `evaluateRecommendationConfidence`。
- 新增 `searchCocktailInspirationTool`。
- 本地低置信度时触发外部灵感检索。

### 阶段 4：会话记忆与体验打磨

- 增加轻量 `AgentSessionState`。
- 支持换一杯、补充材料、持续偏好。
- 增加工具调用状态和降级文案。

## 14. 技术结论

下一阶段不建议直接引入复杂 Agent 框架。最可实施、可扩展的路线是：

> 保持本地规则和知识库作为可信核心，用 OpenAI 做理解和查证，用轻量编排层决定何时调用工具，用标准结构把结果稳定交给前端。

这样既能尽快做出产品感，又不会把核心配方和推荐质量交给不可控的自由生成。
## 状态修订：本地语义推荐层已部分实施

> 更新日期：2026-06-05

已完成：
- `TasteProfile` 已扩展 `bubbly` 维度。
- OpenAI 解析 schema 和系统提示词已补充 `bubbly`。
- 本地 parser 已支持气泡相关关键词解析。
- 已新增 `src/data/cocktailSemanticProfiles.ts`，为部分酒款提供轻量语义关键词。
- `recommendForExploration` 已支持 `semanticQuery`，并抽出 `rankForExploration` 供主推荐和备选推荐共用。
- `matchCocktailsTool` 已使用同一套 taste profile + semantic query 生成主推荐和备选推荐。
- 当 `bubbly` 是明确偏好时，非气泡酒会被强扣分，避免酸甜短饮错误压过气泡长饮。
- 已补充工具层测试，覆盖“清爽、酸、气泡、夏天”场景。

仍未完成：
- 尚未实现完整 `SemanticPreference` / `unmatchedDescriptors` 类型。
- 尚未实现 `tagScore / semanticScore / source` 三分制输出。
- 尚未接入模型对本地候选进行 semantic rerank。
- 前端尚未完整展示“语义匹配”类 trust signal。
