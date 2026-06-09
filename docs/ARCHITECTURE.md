# Architecture

大梦千古 uses a split static/frontend and serverless/AI architecture.

## Runtime Flow

```text
GitHub Pages static app
  -> official DreamLevel JSON
  -> deterministic React game engine
  -> localStorage private saves
  -> lz-string URL hash sharing

Create page
  -> Vercel API proxy
  -> OpenAI Responses API structured output
  -> Zod validation
  -> graph validation
  -> localStorage save
```

## Design Principles

- AI writes structured dream data, not executable code.
- The browser validates all external inputs before rendering.
- The game engine owns branching and stat changes.
- GitHub Pages routing uses hash routes to avoid 404 fallback requirements.
- The MVP does not require an account or database.

## Important Modules

- `src/lib/schemas.ts`: public contract for dreams.
- `src/lib/game.ts`: deterministic game rules.
- `src/lib/share.ts`: compressed URL sharing.
- `api/generate-dream.ts`: server-only OpenAI proxy.

## Future V1 Changes

V1 should add Supabase auth, published dream records, creator profiles, moderation states, and public plaza discovery. The existing `DreamLevel` schema should remain the core portable artifact.
