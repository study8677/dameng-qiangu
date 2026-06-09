# 大梦千古

> AI 历史伟人梦境互动游戏。进入清朝以前伟大人物的关键一梦，用选择改变数值、分支和结局；也可以让 AI 帮你制作自己的历史人物梦境，并用链接分享给别人玩。

![大梦千古封面](public/covers/zhugeliang.svg)

**English:** AI-powered historical interactive fiction game built with Vite, React, TypeScript, Zod, GitHub Pages, and a Vercel OpenAI proxy.

> Demo: after GitHub Pages is enabled, the live site will be available from the repository Pages URL.

## Why It Exists

多数 AI 叙事产品像聊天，缺少稳定规则；多数互动小说创作门槛又太高。**大梦千古**把二者结合起来：

- AI 负责把用户想法生成结构化梦境关卡。
- 游戏引擎负责执行节点、选择、数值和结局。
- 用户不需要账号，生成内容默认保存在本机。
- 分享链接内含压缩后的梦境 JSON，别人打开即可游玩。

第一版聚焦 **清朝以前的历史伟人梦境**，避免泛题材失焦。

## Features

- 6 个官方默认梦境：孔子、屈原、诸葛亮、李白、岳飞、王阳明。
- 选择闯关玩法：事件卡、2-4 个选项、五维数值、多结局。
- AI 制作梦境：选择人物、主题、风格、长度，生成可玩的关卡 JSON。
- 本地私密保存：无账号、无数据库，使用 `localStorage`。
- 分享给大家玩：用 `lz-string` 压缩梦境到 URL hash。
- 安全 AI 代理：OpenAI key 只放在 Vercel Serverless API。
- GitHub Pages 友好：前端完全静态，使用 hash 路由。

## Demo Flow

```text
首页选择伟人
→ 进入官方梦境
→ 阅读事件卡
→ 选择行动
→ 智慧 / 胆识 / 心性 / 声望 / 天命偏差变化
→ 打出不同结局

制作梦境
→ 选择历史人物
→ 填写主题和风格
→ AI 返回 DreamLevel JSON
→ 本机保存
→ 复制分享链接
→ 别人打开链接直接游玩
```

## Tech Stack

- Frontend: Vite, React, TypeScript, Tailwind CSS
- Validation: Zod
- Sharing: lz-string URL compression
- AI Proxy: Vercel Serverless Function + OpenAI Responses API
- Tests: Vitest, Playwright
- Deploy: GitHub Pages

## Quick Start

```bash
npm install
npm run dev
```

Run checks:

```bash
npm run build
npm run test
npm run lint
npm run test:e2e
```

## AI Proxy Setup

The frontend never stores an OpenAI API key. Deploy `api/generate-dream.ts` to Vercel and configure:

```bash
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
ALLOWED_ORIGIN=https://your-github-username.github.io
```

Then set the frontend environment variable:

```bash
VITE_AI_PROXY_URL=https://your-vercel-project.vercel.app/api/generate-dream
```

Without the proxy, all official dreams and local sample generation still work.
For GitHub Pages, add `VITE_AI_PROXY_URL` as a repository variable so the Pages workflow can inject it during build.

## Project Structure

```text
api/generate-dream.ts        # Vercel AI proxy
public/covers/               # Official SVG covers
src/App.tsx                  # Hash-routed app shell
src/data/dreams.ts           # Official dream levels
src/data/figures.ts          # Historical figure catalog
src/lib/game.ts              # Deterministic game engine
src/lib/schemas.ts           # Zod schema contracts
src/lib/share.ts             # URL sharing codec
src/lib/storage.ts           # localStorage persistence
tests/unit/game.test.ts      # Engine/schema/share tests
tests/e2e/app.spec.ts        # Core browser flows
```

## DreamLevel Contract

AI output must be structured game data, not free-form prose:

```ts
type DreamLevel = {
  schemaVersion: 'dream-level-v1'
  title: string
  figureId: string
  initialStats: StatBlock
  startNodeId: string
  nodes: DreamNode[]
  endings: DreamEnding[]
}
```

The frontend validates AI output with Zod and rejects invalid or unplayable graphs.

## Roadmap

- V1: Supabase login, public dream plaza, likes and collections.
- V1.5: creator pages, remix flow, dream quality scoring.
- V2: more pre-Qing figures, official weekly dreams, richer branching tools.
- V3: creator monetization and full moderation workflow.

See [docs/ROADMAP.md](docs/ROADMAP.md).

## Contributing

Contributions are welcome. Good first contributions:

- Add a pre-Qing historical figure dream.
- Improve mobile UI or accessibility.
- Add validation for edge-case dream graphs.
- Add more Playwright flows.

Read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## Community

- [Roadmap](docs/ROADMAP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Changelog](CHANGELOG.md)
- [Security](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

## License

MIT. See [LICENSE](LICENSE).
