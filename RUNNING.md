# 项目运行说明

## 1. 前提条件

- Node.js 已安装（建议 Node 18+ 或更高）
- 项目根目录：`d:\Document\Cocktail`

## 2. 安装依赖

在项目根目录执行：

```bash
npm install
```

## 3. 本地开发运行

当前项目包含前端 React/Vite 应用和后端 Express API 服务。

### 3.1 启动后端服务

在一个终端中执行：

```bash
npm run server
```

后端默认监听 `http://127.0.0.1:4174`

### 3.2 启动前端开发服务器

在另一个终端中执行：

```bash
npm run dev
```

前端默认通过 Vite 启动，并将 `/api` 请求代理到后端服务。

> 注意：前端运行时如果需要访问 `http://localhost:4174/api/*`，必须先启动后端服务。

## 4. 生产构建与预览

### 4.1 构建生产包

```bash
npm run build
```

此命令会先执行 TypeScript 编译 (`tsc`)，然后执行 Vite 打包(`vite build`)。

### 4.2 预览构建结果

```bash
npm run preview
```

该命令会启动 Vite 预览服务器，展示构建后的静态资源。

## 5. 常用命令清单

- `npm run dev`：启动前端开发服务器
- `npm run server`：启动后端 Express 服务
- `npm run build`：构建项目
- `npm run preview`：预览构建结果
- `npm test`：运行测试（`vitest run`）

## 6. 环境变量

后端服务会读取根目录下的 `.env` 文件（如果存在）。常用变量：

- `OPENAI_API_KEY`：OpenAI API Key
- `OPENAI_MODEL_FAST`：默认模型，例如 `gpt-5-mini`
- `OPENAI_BASE_URL`：OpenAI API 基础 URL
- `OPENAI_API_STYLE`：`responses` 或 `chat_completions`
- `AI_TIMEOUT_MS`：AI 请求超时时长，默认 `8000`
- `PORT`：后端服务端口，默认 `4174`
- `FEEDBACK_LOG_PATH`：用户反馈 JSONL 保存路径，默认 `server/data/feedback.jsonl`
- `FEEDBACK_ADMIN_TOKEN`：查看反馈用的管理员 token；未配置或 token 不匹配时无法读取反馈

## 7. 用户反馈

前端的“意见”和 AI 回复后的“有用 / 不准”会提交到：

```bash
POST /api/feedback
```

后端会把反馈逐行写入 `FEEDBACK_LOG_PATH` 指定的 JSONL 文件。默认路径已加入 `.gitignore`，避免误提交用户反馈。

配置 `FEEDBACK_ADMIN_TOKEN` 后，可以读取最近反馈：

```bash
curl "http://127.0.0.1:4174/api/feedback?token=你的token"
```

也可以限制条数：

```bash
curl "http://127.0.0.1:4174/api/feedback?token=你的token&limit=20"
```

### 7.1 接入 Notion

第一阶段可以把 Notion 当作反馈收件箱。前端仍然只调用 `POST /api/feedback`，后端根据环境变量决定写到哪里。

在 Notion 中创建一个数据库或 data source，并添加这些属性（名称和类型需要一致）：

| 属性名 | 类型 |
| --- | --- |
| `Name` | Title |
| `Tone` | Select |
| `Context` | Select |
| `Status` | Select |
| `Relationship` | Select |
| `Message ID` | Text |
| `Text` | Text |
| `Page URL` | URL |
| `Created At` | Date |
| `User Agent` | Text |
| `IP` | Text |
| `Storage ID` | Text |

然后在 Notion 开发者后台创建 integration，复制 token，并把这个 Notion 数据库分享给该 integration。

环境变量示例：

```bash
FEEDBACK_STORAGE=notion
FEEDBACK_JSONL_BACKUP=true
NOTION_TOKEN=secret_xxx
NOTION_FEEDBACK_DATA_SOURCE_ID=xxx
NOTION_VERSION=2026-03-11
```

当前已创建的 Notion 反馈 data source：

```bash
NOTION_FEEDBACK_DATA_SOURCE_ID=686ecf7a-e8a0-4177-9522-a18aa8c8c426
```

如果你的 Notion 页面仍使用 database id，也可以先用：

```bash
NOTION_FEEDBACK_DATABASE_ID=xxx
```

建议保留 `FEEDBACK_JSONL_BACKUP=true`，这样 Notion 写入失败时仍会把反馈留在本地 JSONL 里。

后续要迁移到 Postgres / Supabase / Neon 时，保持前端 `POST /api/feedback` 不变，只需要在后端新增一个 Postgres writer。

## 8. 运行示例

```bash
# 安装依赖
npm install

# 启动后端服务
npm run server

# 另起终端启动前端开发服务器
npm run dev
```

打开浏览器访问 Vite 提供的地址，通常是 `http://localhost:5173`。

---

如果你希望，我还可以继续帮你补充一个 `.env.example` 文件。
