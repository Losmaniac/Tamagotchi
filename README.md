# Pocket Pals

A colorful, mobile-first 3D virtual-pet game (classic Tamagotchi loop), installable as an offline PWA.
English + Czech. Everything is stored on-device; no backend, no accounts, no analytics.

See [CLAUDE.md](CLAUDE.md) for the full product spec and milestones.

## Develop

```bash
npm install
npm run dev          # http://localhost:5173/Tamagotchi/
```

| Script             | What it does                                       |
| ------------------ | -------------------------------------------------- |
| `npm run build`    | Type check + production build into `dist/`         |
| `npm run preview`  | Serve the production build (service worker active) |
| `npm run lint`     | ESLint                                             |
| `npm run format`   | Prettier                                           |
| `npm test`         | Vitest unit tests                                  |
| `npm run coverage` | Unit tests with coverage for `src/game` (≥ 80 %)   |
| `npm run e2e`      | Playwright smoke test on a 390×844 mobile viewport |
| `npm run icons`    | Regenerate PNG icons from `public/icons/icon.svg`  |

If Chromium is preinstalled (e.g. in a sandbox), set `PW_CHROMIUM_PATH=/path/to/chrome` for
`npm run e2e` / `npm run icons` instead of running `npx playwright install`.

The app is built for GitHub Pages at `/Tamagotchi/`. For root hosting, build with `BASE_PATH=/`.
