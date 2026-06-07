# 鸡尾酒 Agent 技术方案 v1.1

## 1. 技术目标

当前阶段技术目标是支撑“推荐结果强化”：

- 用户能通过自然语言、探索选项或已有材料获得一杯可靠推荐。
- 推荐结果能展示对应 SVG 酒图、推荐理由、已有 / 缺失材料、配方步骤和一句酒保建议。
- 系统架构要支持后续扩展到 30 款经典酒、经典 twist、跟做页、分享卡片和中文文案生成。

技术设计原则：

- **性能优先**：MVP 数据量小，核心推荐和 SVG 渲染都应在前端本地完成，避免无意义网络请求。
- **AI 可降级**：AI 只做增强，不阻塞核心流程；没有 API key 或接口失败时，系统仍可运行。
- **配方可信**：配方、材料、步骤、视觉参数来自结构化知识库，不由 LLM 临场生成。
- **模块可复用**：推荐、解析、视觉、文案、分享卡片分别独立，后续版本按模块扩展。
- **渐进复杂度**：当前不引入向量库、GraphRAG、fine-tune、复杂状态管理或后端数据库。

## 2. 推荐技术栈

### 2.1 前端

- React + TypeScript。
- Vite 作为开发和构建工具。
- Vitest 做核心逻辑和组件测试。
- SVG 组件化渲染酒图。

当前项目已经采用上述栈，应继续沿用。

### 2.2 服务端

- Node.js + Express。
- 服务端只承担 AI 相关 API 和未来图片合成 / 文案生成接口。
- 不把核心推荐逻辑放到服务端，避免本地体验依赖网络。

### 2.3 数据层

当前阶段：

- 使用 TypeScript 静态数据文件。
- 优先修复现有中文乱码。
- 给每杯酒补充 `visualSpec` 和 `bartenderTip`。

扩展到 30 款酒后：

- 迁移为 JSON 知识库。
- 使用构建期校验脚本验证数据完整性。
- 前端导入编译后的 typed data。

不建议当前引入数据库。

## 3. 总体架构

MVP 架构：

```text
UI Input
↓
Preference Parser
↓
Recommendation Engine
↓
Result Presenter
↓
CocktailVisual SVG Renderer
↓
Safety Copy
```

AI 增强路径：

```text
Natural Language Input
↓
/api/parse-ingredients
↓
OpenAI parsing when key exists
↓
Local parser fallback
↓
Recommendation Engine
```

后续扩展路径：

```text
Intent Router
↓
Template Matcher
↓
Twist Rule Engine
↓
Balance Checker
↓
Caption Generator
↓
Share Card Composer
```

## 4. 模块边界

### 4.1 `domain/ingredientParser`

职责：

- 本地解析用户输入中的常见材料名、英文别名和中文别名。
- 输出标准材料 ID 和未识别片段。
- 作为 AI 解析失败时的降级方案。

不负责：

- 推荐排序。
- 判断口味偏好。
- 生成解释文案。

扩展建议：

- 将 alias 索引预编译为 Map，避免每次解析时重复排序。
- 增加“长别名优先”规则，避免 `rum` 抢先匹配 `white rum`。
- 后续支持用户确认未识别材料，但 MVP 不做。

### 4.2 `domain/recommendation`

职责：

- 根据已有材料、口味偏好、强度偏好计算推荐结果。
- 输出排序后的推荐列表或探索模式推荐。
- 输出可展示的 `ownedIngredients`、`missingIngredients`、`reason`。

不负责：

- 解析自然语言。
- 生成 SVG。
- 生成 AI 文案。

扩展建议：

- 当前保持轻量分数模型。
- v1.2 扩展为 100 分模型。
- 推荐算法必须保持纯函数，方便测试和后续迁移。

### 4.3 `data/cocktails`

职责：

- 存储经典酒结构化数据。
- 当前阶段包含 12 款酒。
- v1.1 增加视觉字段和酒保建议。

风险：

- 当前文件中文已出现乱码，应优先修复。
- 修复时建议直接重写数据，不要在乱码基础上修补。

### 4.4 `components/ListeningGlass`

职责：

- 渲染 AI 酒保身份。
- 表达 idle / listening / thinking / revealing 状态。

不负责：

- 渲染具体酒款。
- 表达每杯酒的真实配方视觉。

优化建议：

- 将颜色、状态、动效 token 化。
- 后续适配亮色轻奢 UI。
- 保持 SVG 可访问性文本正常中文。

### 4.5 `components/CocktailVisual`

新增模块。

职责：

- 接收 `CocktailVisualSpec`。
- 根据杯型渲染对应 SVG。
- 组合酒液、冰块、装饰物、气泡、杯口边等图层。

不负责：

- 推荐逻辑。
- 数据补全。
- AI 图像生成。

建议组件拆分：

- `CocktailVisual`
- `GlassHighball`
- `GlassCoupe`
- `GlassOldFashioned`
- `GlassMartini`
- `LiquidLayer`
- `IceLayer`
- `GarnishLayer`
- `BubbleLayer`
- `RimLayer`

## 5. 核心数据模型

### 5.1 MVP 扩展类型

```ts
type CocktailVisualSpec = {
  glassType: "highball" | "coupe" | "old_fashioned" | "martini";
  drinkColor: string;
  opacity: number;
  hasIce: boolean;
  iceStyle: "none" | "cube" | "large_cube" | "crushed";
  foamLevel: "none" | "low" | "medium" | "high";
  garnish: Array<
    | "mint"
    | "lime_wedge"
    | "lemon_wheel"
    | "orange_peel"
    | "orange_slice"
    | "cherry"
    | "olive"
    | "coffee_beans"
  >;
  rimStyle: "none" | "salt" | "sugar";
  straw: boolean;
  bubbleLevel: "none" | "low" | "medium" | "high";
};

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
  bartenderTip: string;
};
```

### 5.2 后续完整知识库模型

当扩展到 30 款经典酒和 twist 时，再增加：

- `sourceType`
- `ibaCategory`
- `template`
- `baseSpirits`
- `method`
- `methodZh`
- `flavorProfileZh`
- `bestFor`
- `avoidIfUserDislikes`
- `twistFriendly`
- `safeTwistDirections`
- `avoidTwists`
- `shareTagsZh`
- `captionSeedZh`

不要在当前 MVP 一次性迁移全部字段，否则数据维护成本高于收益。

## 6. AI 技术策略

### 6.1 AI 当前职责

AI 当前只做两类增强：

1. 自然语言材料解析。
2. 后续可生成短推荐解释或酒保建议。

核心推荐不依赖 AI。原因：

- 降低延迟。
- 降低成本。
- 避免配方幻觉。
- 无 API key 时 demo 仍能运行。

### 6.2 API 设计

当前保留：

```http
POST /api/parse-ingredients
```

输入：

```json
{
  "text": "我有金酒、柠檬和糖浆"
}
```

输出：

```json
{
  "ingredients": ["gin", "lemon-juice", "simple-syrup"],
  "unknown": []
}
```

设计要求：

- 服务端有 `OPENAI_API_KEY` 时使用 AI 解析。
- 没有 key 或 AI 失败时返回本地解析结果。
- 不把 OpenAI key 暴露到前端。
- API 输出必须是标准材料 ID，不输出自由配方。

### 6.3 后续 AI 接口

后续再增加：

```http
POST /api/generate-caption
POST /api/generate-bartender-note
```

但这两个接口不进入当前 MVP。

## 7. SVG 渲染技术方案

### 7.1 渲染方式

使用 React SVG 组件，不使用 canvas，不使用 AI 图片生成。

原因：

- 首屏加载快。
- 组件复用高。
- 样式统一。
- 可根据数据实时变化。
- 后续可嵌入分享卡片。

### 7.2 图层结构

```text
Glass Shape
↓
Liquid Layer
↓
Ice Layer
↓
Bubble Layer
↓
Garnish Layer
↓
Rim Layer
↓
Highlight Layer
```

### 7.3 性能策略

- SVG 控制在 1 个组件树内，不引入大型图像资源。
- 复杂滤镜和 blur 少用，尤其在列表页避免多实例动画。
- 结果页只渲染当前推荐酒图，不批量渲染全部酒图。
- 动画默认只在主视觉和当前结果图上运行。
- 分享卡片导出时可关闭动画，使用静态 SVG 状态。

### 7.4 可复用策略

- 杯型独立组件。
- 装饰物独立组件。
- 冰块独立组件。
- 酒液颜色通过 `visualSpec.drinkColor` 控制。
- 后续新增酒款优先补数据，不新增专用组件。

## 8. 性能方案

### 8.1 前端运行时

当前数据量小，推荐逻辑可在前端同步执行。

性能目标：

- 首页首屏资源轻量。
- 用户点击推荐后 100ms 内可得到本地结果。
- AI 解析不阻塞手动点选材料流程。

优化策略：

- `ingredients` 别名索引预计算。
- 推荐函数保持纯函数，避免 React 组件内重复计算复杂逻辑。
- SVG 组件按结果页懒加载可选，但当前规模不强制。
- 不引入大型 UI 框架。
- 不在 MVP 引入全局状态库。

### 8.2 网络与 AI

- 材料自然语言解析使用短请求。
- 接口超时后直接降级本地解析。
- AI 结果只用于补充标准材料 ID，不改变配方库。
- 后续如果引入文案生成，应加缓存，避免同一酒款重复请求。

### 8.3 构建产物

- 继续使用 Vite。
- SVG 以 React 组件形式进入 bundle。
- 不引入图片大资源。
- 后续 30 款酒 JSON 可被 tree-shaking 或静态导入，不需要数据库查询。

## 9. 可扩展方案

### 9.1 从 12 款扩展到 30 款

先扩数据，再扩逻辑。

步骤：

1. 修复当前 12 款中文数据。
2. 为 12 款补齐 `visualSpec`。
3. 加数据完整性测试。
4. 扩展到 30 款。
5. 再引入 `template`、`bestFor`、`avoidIfUserDislikes` 等字段。

### 9.2 从经典推荐扩展到 twist

twist 不应由 LLM 自由生成。

技术路径：

```text
Classic Cocktail
↓
Template Matcher
↓
Twist Rule
↓
Balance Checker
↓
改编说明
```

第一批只支持：

- 降低酒精感。
- 更清爽。
- 不要苦。
- 更果味。

所有 twist 输出必须标注：

> 这是基于经典结构的改编建议，不是官方配方。

### 9.3 从结果页扩展到分享卡片

分享卡片应该复用 `CocktailVisual`，不要重做酒图系统。

技术路径：

- 结果页 SVG 作为参考图。
- 用户照片作为上传图。
- 使用 HTML / SVG 组合生成 4:5 分享卡。
- 导出时再考虑 `html-to-image` 或 canvas。

MVP 当前不引入这些依赖。

## 10. 测试策略

### 10.1 当前必须测试

- 材料解析：
  - 中文材料名。
  - 英文别名。
  - 未识别材料保留。

- 推荐算法：
  - 已有材料越多排序越高。
  - 缺失材料越少排序越高。
  - 口味偏好能影响同等材料匹配下的排序。

- SVG 组件：
  - `CocktailVisual` 能根据 `visualSpec` 渲染正确杯型。
  - garnish、ice、rim、bubble 能按 spec 出现或隐藏。
  - `ListeningGlass` 只作为 AI 形象，不用于酒款展示。

- 数据完整性：
  - 每杯酒有 `visualSpec`。
  - 每个 ingredient ID 都存在。
  - 每杯酒至少有 2 个步骤。
  - 中文字段不为空且不包含乱码特征。

### 10.2 后续测试

- twist 规则测试。
- balance checker 测试。
- 分享卡片导出测试。
- 文案版权安全测试。

## 11. 错误处理与降级

### 11.1 AI 解析失败

降级到本地解析。

用户不应看到技术错误，只看到：

> 已按本地材料词库识别，未识别材料可以手动选择。

### 11.2 材料不足

推荐仍然可以给出，但结果页必须明确：

- 已有材料。
- 缺失材料。
- 最少购买建议。

### 11.3 未识别材料

保留在 UI 中展示，不阻断推荐。

### 11.4 无推荐结果

当前数据量小，理论上应总能返回推荐。后续可加兜底：

- 推荐最接近口味的经典酒。
- 或提示用户减少限制。

## 12. 安全与合规实现

安全规则不要只写在提示词里，应在业务层有静态规则：

- 检测未成年人、开车、孕期、服药、酒精过敏等关键词。
- 命中后给出避免饮酒或无酒精方向。
- 禁止把“容易醉、更快醉”作为推荐理由。
- twist 不允许通过增加酒精强度作为卖点。

歌词版权规则仅在后续 `lyric_mood` 上线时启用：

- 不引用真实歌词。
- 不改写真实歌词。
- 不模仿特定歌手或歌曲。
- 不输出具体歌名或歌手名。

## 13. 版本实施路线

### v1.1：推荐结果强化

工程目标：

- 修复中文乱码。
- 扩展 `Cocktail` 类型。
- 给 12 款酒补 `visualSpec` 和 `bartenderTip`。
- 实现 `CocktailVisual`。
- 结果页接入酒图和酒保建议。
- 增加数据完整性测试。

验收标准：

- 所有中文字段正常显示。
- 每杯酒都有对应 SVG 展示。
- 推荐结果页包含酒图、推荐理由、已有 / 缺失材料、配方、步骤、酒保建议。
- `npm test` 和 `npm run build` 通过。

### v1.2：内容和推荐质量

工程目标：

- 扩展到 30 款经典酒。
- 增加基础替代材料规则。
- 推荐算法升级到 100 分模型。
- 增加轻量口味解释。

验收标准：

- 30 款酒数据完整。
- 推荐结果能解释主要排序原因。
- 缺失材料建议更合理。

### v1.3：经典 twist

工程目标：

- 增加 Template Matcher。
- 增加 Twist Rule Engine。
- 增加 Balance Checker。
- 支持 4 类高频 twist。

验收标准：

- 所有 twist 明确标注“经典结构改编”。
- 不会误称为官方配方。
- 不生成完全原创配方。

### v2.0：跟做与分享

工程目标：

- 独立跟做页。
- 用户上传照片。
- 一个 4:5 分享卡片模板。
- 默认中文分享文案。
- 保存图片。

验收标准：

- 用户能从推荐结果进入跟做。
- 能上传照片并生成一张分享卡。
- 分享卡复用 `CocktailVisual`。

## 14. 当前风险与处理

### 14.1 中文乱码

风险：现有数据和部分源码中文已经乱码，继续扩展会污染知识库。

处理：v1.1 第一任务是重写中文数据，并加乱码检测测试。

### 14.2 AI 幻觉

风险：LLM 生成不可靠配方。

处理：AI 不生成配方，只解析、解释、生成短文案。

### 14.3 SVG 组件膨胀

风险：为每杯酒写独立 SVG，导致不可维护。

处理：只做组件化图层，由 `visualSpec` 驱动。

### 14.4 过早做分享闭环

风险：上传、裁切、卡片、文案会拖慢核心推荐体验验证。

处理：分享功能后置，当前只预留数据和组件复用路径。

## 15. 最终技术判断

当前最优技术路线不是重后端、重 AI、重图像生成，而是：

> 前端静态知识库 + 纯函数推荐引擎 + 可降级 AI 解析 + 组件化 SVG 酒图 + 后续可复用的分享卡片管线。

这条路线性能稳定、成本低、可解释、可扩展，适合当前产品节奏。
