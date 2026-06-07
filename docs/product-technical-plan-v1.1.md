# 鸡尾酒 Agent 产品与技术规划文档 v1.1

## 1. 产品定位

这是一个中文鸡尾酒推荐与跟做辅助产品。

当前阶段的核心不是做完整社交分享工具，也不是让 AI 凭空发明鸡尾酒，而是解决一个更明确的问题：

> 帮用户基于口味、场景和现有材料，选出一杯靠谱、好看的经典鸡尾酒，并给出可执行做法。

当前项目已有移动端 demo 基础：

- 探索推荐：根据心情、口味、强度推荐一杯酒。
- 材料推荐：根据已有材料推荐可做酒款，并给出缺失材料。
- 本地材料解析和服务端 AI 解析接口。
- 12 款经典鸡尾酒数据。
- “聆听之杯”SVG AI 形象。

融合后的产品方向是：先把“推荐结果”做强，再逐步扩展到“跟做”和“分享”。

## 2. 当前 MVP 核心闭环

MVP 只验证推荐和执行价值：

```text
用户输入口味 / 材料 / 场景
↓
系统解析需求
↓
推荐一杯经典鸡尾酒
↓
展示对应 SVG 酒图
↓
说明推荐理由
↓
展示已有材料、缺失材料、配方和步骤
↓
给出一句酒保建议
```

当前 MVP 不把照片上传、成果卡片、多文案风格放进主闭环。它们属于后续分享阶段。

## 3. 关键产品原则

- **经典优先**：优先推荐真实经典鸡尾酒；不做完全原创配方。
- **结果页优先**：当前最重要的是把推荐结果做可信、好看、可执行。
- **SVG 视觉建立产品感**：每杯酒都有组件化 SVG 展示图，不依赖 AI 每次生成图片。
- **AI 负责理解与表达，不负责乱编配方**：LLM 用于偏好解析、推荐解释、酒保建议和后续文案；配方和规则来自知识库。
- **分享闭环后置**：上传照片、卡片合成、多文案风格在推荐体验验证后再做。
- **安全与版权内置**：不鼓励过量饮酒，不引用真实歌词，不向未成年人提供饮酒建议。

## 4. UI 视觉系统约束

### 4.1 整体视觉方向

产品视觉采用 **高级、优雅、简约的轻奢生活方式 App** 方向。

整体应像高端酒单、收藏卡片和现代移动应用的结合。界面要干净、有留白、层级清楚，带一点精品酒吧和生活方式杂志感，但不要手绘感太强。

### 4.2 色彩系统

主体使用亮色中性色调：

- 象牙白。
- 暖米白。
- 浅香槟金。
- 浅灰米色。

约束：

- 避免大面积高饱和颜色。
- 不使用大面积暗色酒吧背景作为主系统。
- 鸡尾酒本身的颜色可以作为局部主题色，用于酒液、徽章、细线或局部高光。
- UI 主体保持中性百搭，确保不同颜色的鸡尾酒都能适配。

### 4.3 界面组件风格

- 大面积浅色背景。
- 柔和阴影。
- 圆角卡片。
- 细线边框。
- 浅金色分割线。
- 轻量徽章和编号。
- 标签、筛选项使用浅色 pill 样式。
- 控件状态要清楚，但不要依赖强烈颜色对比。

### 4.4 字体与排版

- 标题可使用偏宋体或 serif 风格，建立酒单和生活方式杂志感。
- 正文使用清晰现代无衬线字体，保证移动端可读。
- 字体层级要优雅克制，不做过大标题堆叠。
- 中文排版优先保证清晰、舒展、留白足够。

### 4.5 酒图 SVG 风格

酒图必须适合用 SVG 组件化生成，不走水彩、手绘或真实插画路线。

具体约束：

- 统一线条粗细。
- 简化几何形状。
- 扁平色块 + 少量透明渐变。
- 玻璃杯、冰块、柠檬、薄荷、吸管等都以可复用 SVG 组件实现。
- 每杯酒的颜色可以作为局部主题色，但不改变 UI 主体的中性色系统。

最终目标：做成一个亮色、高级、百搭、可组件化实现的鸡尾酒推荐与分享 App 界面系统。

## 5. AI 形象与酒图系统

### 5.1 AI 形象：聆听之杯

“聆听之杯”是 AI 酒保的视觉身份，不是每杯酒的展示图。

使用场景：

- 首页主视觉。
- 用户输入或选择时的聆听状态。
- 推荐生成时的思考状态。
- 结果揭示时的显影状态。

表现方式：

- 不做人形酒保。
- 不加眼睛、嘴巴或卡通表情。
- 用杯沿微光、酒液流动、气泡、冰块和光线表达状态。
- 后续视觉应适配亮色轻奢 UI 系统，而不是当前偏暗色氛围。

### 5.2 酒款 SVG 展示图

每杯推荐酒需要有对应的 SVG 酒图，由 `visualSpec` 驱动渲染。

“聆听之杯”和“酒款展示图”要拆开：

- `ListeningGlass`：AI 形象。
- `CocktailVisual`：具体酒款参考图。

第一阶段支持 4 种核心杯型即可覆盖当前 demo：

- `highball`：Mojito、Gin Tonic、Bloody Mary、Tequila Sunrise。
- `coupe`：Margarita、Daiquiri、Cosmopolitan。
- `old_fashioned`：Old Fashioned、Negroni、Whiskey Sour、Gin Sour。
- `martini`：Martini。

后续扩展到 Collins、Champagne Flute、Wine Glass、Mule Mug、Hurricane 等杯型。

## 6. 功能必要性分层

### 6.1 MVP 必做

这些功能直接支撑核心闭环：

1. 修复当前数据文件中的中文乱码。
2. 保留中文输入解析和材料解析。
3. 保留探索推荐和材料推荐。
4. 给现有 12 款酒补充 `visualSpec`。
5. 新增 `CocktailVisual` SVG 渲染组件。
6. 在推荐结果页展示对应酒图。
7. 在结果页展示推荐理由、已有材料、缺失材料、配方和步骤。
8. 增加一句短酒保建议，例如替代材料、口味调整或新手避坑。
9. 保留基础安全提示。

### 6.2 MVP 暂不做，但保留结构

这些功能有价值，但不应进入当前 MVP：

- 跟做页：结果页先承载步骤，不单独拆页。
- 用户上传照片。
- 手动裁切。
- 成果分享卡片。
- 多文案风格。
- 歌词氛围文案。

### 6.3 明确不做

- 完全原创鸡尾酒生成。
- 自动识别杯子。
- 自动去背景。
- 复杂图像生成。
- 音乐平台接入。
- 真实歌词展示。
- 用户长期偏好记忆。
- 向量库、GraphRAG、fine-tune。

## 7. 页面流程

### 7.1 首页 / 输入页

目标：让用户快速进入“探索”或“材料推荐”。

保留两个入口：

- 探索今晚喝什么。
- 用现有材料调酒。

增强方向：

- 首页以“聆听之杯”作为 AI 酒保主视觉。
- 输入区支持自然语言，例如：
  - “我想喝清爽一点的。”
  - “我家里有金酒和柠檬。”
  - “我想做一杯适合夏天的。”
  - “我想要像 Margarita 但没那么烈。”

### 7.2 推荐结果页

这是当前最重要的页面。

必须展示：

- 酒名：英文名 + 中文名。
- 对应酒款 SVG 图。
- 类型：经典鸡尾酒。
- 推荐理由。
- 已有材料。
- 缺失材料。
- 配方。
- 做法。
- 口味预期。
- 一句酒保建议。

如果后续支持 twist，再增加“经典结构改编”标识和改编说明。

### 7.3 后续跟做页

当前 MVP 不单独做跟做页。后续如果用户完成率足够，再拆出：

- 参考 SVG 酒图。
- 材料清单。
- 步骤说明。
- 小贴士。
- 拍照 / 上传成品按钮。

### 7.4 后续成果卡片页

当前 MVP 不做成果卡片。后续分享阶段再做：

- 左侧：SVG 参考酒图。
- 右侧：用户实拍成品图。
- 酒名。
- 风味标签。
- 默认中文文案。
- 保存图片。

多文案风格和歌词氛围属于更后置增强。

## 8. 推荐与 Agent 架构

当前 MVP 架构应保持轻量：

```text
User Input
↓
Preference Parser
↓
Cocktail Retriever
↓
Recommendation Scorer
↓
SVG Renderer
↓
Chinese Result Presenter
↓
Safety Guard
```

后续 twist 和分享阶段再扩展为：

```text
Intent Router
↓
Template Matcher
↓
Twist Rule Engine
↓
Balance Checker
↓
User Photo Processor
↓
Layout Composer
↓
Caption Generator
```

### 8.1 Preference Parser

从中文输入中解析：

```ts
type ParsedPreference = {
  baseSpirit: string[];
  availableIngredients: string[];
  flavorPreferences: string[];
  dislikedFlavors: string[];
  strengthPreference: "low" | "medium" | "high" | "unknown";
  difficulty: "easy" | "normal" | "professional" | "unknown";
  occasion: "summer" | "date" | "party" | "aperitif" | "after_dinner" | "home" | "unknown";
  requestType:
    | "classic_recommendation"
    | "ingredient_matching"
    | "classic_twist"
    | "substitution";
};
```

### 8.2 Cocktail Retriever

第一版使用 TypeScript 或 JSON 知识库 + 规则过滤 + 打分排序。

暂不引入向量库或 GraphRAG。

### 8.3 Recommendation Scorer

当前优先评估：

- 已有材料匹配。
- 口味匹配。
- 强度匹配。
- 难度匹配。
- 场景匹配。

后续扩展到 100 分模型。

### 8.4 后续 Template Matcher 和 Twist Rule Engine

第二阶段再支持“像 Margarita 但没那么烈”这类请求。

第一版 twist 只支持 4 类高频、安全、可解释场景：

- 不太烈：减少基酒，加苏打、茶、果汁或气泡饮料拉长。
- 更清爽：加气泡、柑橘、薄荷、冰块。
- 不要苦：避开 Campari 和 bitter-heavy 结构。
- 更果味：加 15-30 ml 果汁或果泥，并相应减少糖。

## 9. 数据结构设计

### 9.1 当前 Cocktail 最小扩展

当前 MVP 不一次性迁移到完整知识库结构。先在现有 `Cocktail` 上增加视觉和推荐所需字段。

```ts
type Cocktail = {
  id: string;
  name: string;
  englishName: string;
  intro: string;
  base: string;
  tags: string[];
  strength: "light" | "medium" | "strong";
  glass: string;
  garnish: string;
  ingredients: CocktailIngredient[];
  steps: string[];
  tasteProfile: TasteProfile;
  visualSpec: CocktailVisualSpec;
  bartenderTip?: string;
};
```

### 9.2 CocktailVisualSpec

```ts
type CocktailVisualSpec = {
  glassType: "highball" | "coupe" | "old_fashioned" | "martini";
  drinkColor: string;
  opacity: number;
  hasIce: boolean;
  iceStyle: "none" | "cube" | "large_cube" | "crushed";
  foamLevel: "none" | "low" | "medium" | "high";
  garnish: Array<"mint" | "lime_wedge" | "lemon_wheel" | "orange_peel" | "orange_slice" | "cherry" | "olive" | "coffee_beans">;
  rimStyle: "none" | "salt" | "sugar";
  straw: boolean;
  bubbleLevel: "none" | "low" | "medium" | "high";
};
```

### 9.3 后续完整 Cocktail

扩展到 30 款酒和 twist 规则时，再迁移到完整知识库结构，增加：

- `sourceType`
- `ibaCategory`
- `template`
- `baseSpirits`
- `method`
- `flavorProfileZh`
- `bestFor`
- `avoidIfUserDislikes`
- `twistFriendly`
- `safeTwistDirections`
- `shareTagsZh`
- `captionSeedZh`

## 10. SVG 渲染方案

使用组件化 SVG，不使用 AI 图片生成作为主路径。

MVP 组件拆分：

- `CocktailVisual`：入口组件，接收 `visualSpec`。
- `GlassHighball`。
- `GlassCoupe`。
- `GlassOldFashioned`。
- `GlassMartini`。
- `LiquidLayer`。
- `IceLayer`。
- `GarnishLayer`。
- `BubbleLayer`。
- `RimLayer`。

优点：

- 风格统一。
- 成本低。
- 速度快。
- 可控性强。
- 适合前端实时渲染。
- 方便后续适配分享卡片和不同尺寸。

## 11. 分享卡片方案

分享卡片不进入当前 MVP。

进入分享阶段后，优先做一个竖版 4:5 模板：

- 顶部：今晚我完成了 Mojito 莫吉托。
- 中部：参考酒图 / 我的成品。
- 下部：风味标签。
- 底部：默认中文文案。

第一版只做默认文案，不做 4 种文案风格。

视觉风格：

- 浅色中性轻奢。
- 简约。
- 优雅。
- 克制。
- 高级生活方式感。
- 中文排版清晰。
- 细线框。
- 大留白。

## 12. 中文文案生成

当前 MVP 只需要结果页短文本：

- 推荐理由。
- 一句酒保建议。
- 可选替代材料提示。

分享阶段再做默认分享文案。

4 种文案风格后置：

- `casual_share`：轻松分享。
- `achievement`：成就打卡。
- `professional_note`：专业点评。
- `lyric_mood`：歌词氛围。

`lyric_mood` 优先级最低，因为版权规则复杂，且不是推荐闭环的必要功能。

## 13. 推荐打分逻辑

当前实现可以先保持轻量打分。

后续内容扩展到 30 款酒后，再使用 100 分模型：

- 基酒匹配：20 分。
- 已有材料匹配：25 分。
- 口味匹配：25 分。
- 强度匹配：10 分。
- 难度匹配：10 分。
- 场景匹配：10 分。

扣分项：

- 包含用户不喜欢的味道：-30。
- 缺少关键材料：-20。
- 强度高于用户需求：-15。
- 制作复杂度高于用户需求：-10。
- 需要专业设备：-10。

## 14. 知识库目录建议

当前阶段不急于创建完整知识库目录。先修复并稳定现有 TypeScript 数据。

扩展到 30 款经典酒时，再迁移到：

```text
cocktail_agent_knowledge/
  01_classic_cocktails.json
  02_cocktail_templates.json
  03_twist_rules.json
  04_flavor_taxonomy.json
  05_substitution_rules.json
  06_visual_components.json
  07_caption_rules.json
  08_safety_rules.md
  09_agent_instructions.md
```

## 15. 安全与合规规则

系统不得：

- 鼓励过量饮酒。
- 鼓励快速喝酒。
- 鼓励拼酒。
- 用“容易醉”作为卖点。
- 向未成年人提供饮酒建议。

遇到以下情况建议避免饮酒或提供无酒精方向：

- 未成年人。
- 开车。
- 孕期。
- 服药。
- 酒精过敏。
- 身体不适。

版权规则：

- 歌词氛围模式必须原创。
- 不引用真实歌词。
- 不改写真实歌词。
- 不模仿特定歌曲。
- 不展示歌词片段。

## 16. 版本规划

### v1.1：推荐结果强化

- 修复中文数据编码。
- 增加每杯酒的 `visualSpec`。
- 新增 `CocktailVisual`。
- 在结果页展示对应 SVG 酒图。
- 增加一句酒保建议。
- 保留 `ListeningGlass` 作为 AI 形象。
- 将整体 UI 方向调整为亮色中性轻奢系统。

### v1.2：内容和推荐质量

- 扩展到 30 款经典酒。
- 增加基础替代材料规则。
- 调整推荐打分为 100 分模型。
- 增加轻量口味解释。

### v1.3：经典 twist

- 增加轻量 `Template Matcher`。
- 增加基础 `Twist Rule Engine`。
- 增加 `Balance Checker`。
- 支持“不太烈 / 更清爽 / 不要苦 / 更果味”。

### v2.0：跟做与分享

- 独立跟做页。
- 用户上传照片。
- 一个成果分享卡片模板。
- 默认中文分享文案。
- 保存图片。

### v2.1：分享增强

- 多卡片模板。
- 多文案风格。
- 照片优化。
- 歌词氛围文案。
- 成就体系。

## 17. 当前技术债与注意事项

当前源码中部分中文在终端读取时已经出现乱码，包括：

- `src/data/cocktails.ts`
- `src/domain/recommendation.ts`
- `src/components/ListeningGlass.tsx` 的中文可访问性文本。

如果浏览器中也出现乱码，应优先修复文件编码和中文内容。即使浏览器显示正常，也建议在 v1.1 数据整理时统一修复，避免后续数据迁移时污染知识库。

## 18. 最终产品判断

当前最值得做的不是继续扩“AI 能说什么”，而是把结果页做强：

> 推荐理由 + 对应 SVG 酒图 + 已有 / 缺失材料 + 清晰步骤 + 一句酒保建议。

这五个做好，产品就已经从普通推荐 demo 变成有审美、有可信度、有可执行性的鸡尾酒 Agent。

当前最优先事项是：

1. 修复中文数据。
2. 建立每杯酒的 SVG 酒图系统。
3. 将 UI 迁移到亮色中性轻奢视觉系统。
4. 强化推荐结果页。
5. 再扩展经典酒知识库和 twist 规则。
