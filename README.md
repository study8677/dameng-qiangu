# Dameng Qiangu

[English](README.md) | [简体中文](README.zh-CN.md)

[![Deploy GitHub Pages](https://github.com/study8677/dameng-qiangu/actions/workflows/deploy.yml/badge.svg)](https://github.com/study8677/dameng-qiangu/actions/workflows/deploy.yml)
[![CI](https://github.com/study8677/dameng-qiangu/actions/workflows/ci.yml/badge.svg)](https://github.com/study8677/dameng-qiangu/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/license-MIT-1c524c)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-Structured%20Outputs-111827)

**AI-native historical interactive fiction.** Enter the dreams of great pre-Qing historical figures, make hard choices at the turning points of their lives, and create your own shareable dream levels with AI. Creators can start from the official cast or define a custom pre-Qing historical figure.

[Play the live demo](https://study8677.github.io/dameng-qiangu/) · [Read the architecture](docs/ARCHITECTURE.md) · [View the roadmap](docs/ROADMAP.md)

![Dameng Qiangu preview](docs/assets/social-preview.svg)

## Why It Is Different

Most AI story products feel like chat. Most interactive fiction tools require a lot of authoring work. Dameng Qiangu sits between them:

- AI generates structured `DreamLevel` data, not executable code.
- A deterministic game engine owns nodes, choices, stats, endings, and sharing.
- Official dreams are hand-authored, so the game is playable without any AI proxy.
- User-created dreams stay in `localStorage` by default and can be shared through compressed URL links.
- The theme is intentionally focused: great historical figures before the Qing dynasty.

## Gameplay

The MVP ships with six official dreams:

| Figure | Era | Official dream |
| --- | --- | --- |
| Confucius | Spring and Autumn | `Apricot Altar: Asking Ritual` |
| Qu Yuan | Warring States | `The Waking Soul at Miluo` |
| Zhuge Liang | Three Kingdoms | `The Last Lamp at Wuzhang Plains` |
| Li Bai | Tang | `Drunken Moon over Chang'an` |
| Yue Fei | Song | `Iron Cavalry at Wind-Wave Pavilion` |
| Wang Yangming | Ming | `The Heart-Lamp at Longchang` |

Each dream has 5-7 nodes, 2-4 choices per node, five mutable stats, and at least three reachable endings. Every choice now produces an immediate story consequence called **Echo of the Last Thought**, so different routes feel more dramatic even before the final ending.

## AI Dream Creator

Creators choose an official figure or define a custom pre-Qing historical figure, then set the theme, tone, length, and extra notes. The Vercel API proxy asks OpenAI for strict JSON and the frontend validates the result with Zod before saving it.

The AI is limited to:

- pre-Qing historical figure dreams,
- official or custom historical figures,
- structured `DreamLevel` JSON,
- playable branching nodes and endings,
- narrative text only, never executable logic.

Without a configured AI proxy, players can still play official dreams and save a local sample dream.

## Tech Stack

- **Frontend:** Vite, React, TypeScript, Tailwind CSS
- **Validation:** Zod schemas for all dream data
- **Sharing:** `lz-string` compressed URL hash payloads
- **AI proxy:** Vercel Serverless Function + OpenAI Responses API Structured Outputs
- **Testing:** Vitest and Playwright
- **Hosting:** GitHub Pages for the static app

## Quick Start

```bash
npm install
npm run dev
```

Run the main checks:

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

Then set the frontend variable:

```bash
VITE_AI_PROXY_URL=https://your-vercel-project.vercel.app/api/generate-dream
```

For GitHub Pages, add `VITE_AI_PROXY_URL` as a repository variable so the deploy workflow can inject it during build.

## Project Structure

```text
api/generate-dream.ts        # Vercel AI proxy
public/covers/               # Official SVG cover art
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

## Roadmap

- **V1:** Supabase login, public dream plaza, likes, collections, moderation states.
- **V1.5:** Creator pages, remix flow, graph editor, quality scoring.
- **V2:** More pre-Qing figures, hidden endings, achievements, figure traits.
- **V3:** Creator marketplace, monetization experiments, full moderation workflow.

## Contributing

Good first contributions:

- Add a new pre-Qing official dream.
- Improve the mobile reading experience.
- Add validation for edge-case dream graphs.
- Expand Playwright coverage for sharing and creation flows.
- Improve English translations for the official dreams.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Community

- [Roadmap](docs/ROADMAP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Changelog](CHANGELOG.md)
- [Security](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

## License

MIT. See [LICENSE](LICENSE).
