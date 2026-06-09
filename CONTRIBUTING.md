# Contributing

Thanks for helping improve 大梦千古.

## Development

```bash
npm install
npm run dev
```

Before submitting changes:

```bash
npm run build
npm run test
npm run lint
npm run test:e2e
```

## Content Guidelines

- Keep main characters before the Qing dynasty.
- Use respectful historical fantasy; do not present dream branches as verified history.
- Every official dream should have 5-7 nodes and at least 3 reachable endings.
- Choices should change state or branch meaningfully.
- Do not add modern political figures, hate content, erotic content, or extreme graphic violence.

## Code Guidelines

- Keep AI output as data, never executable code.
- Validate all AI, URL hash, and localStorage inputs with Zod.
- Keep game engine logic deterministic.
- Preserve GitHub Pages compatibility with hash routing.
