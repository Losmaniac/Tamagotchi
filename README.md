# Pocket Pals

A colorful, mobile-first 3D virtual-pet game with the classic Tamagotchi loop, installable as an
offline PWA. Pick an animal, hatch it, and keep it alive: feed, play, clean, turn the lights off
and give medicine. Neglect has real consequences. English and Czech. Everything stays on the
device: no backend, no accounts, no analytics.

See [CLAUDE.md](CLAUDE.md) for the full product spec.

## Features

- **11 species × 3 colors** (cat, dog, bunny, fox, panda, baby dragon, axolotl, penguin, owl,
  turtle and Sparky, an original electric critter), built procedurally from primitives. No
  downloaded assets.
- **Real-time simulation:** stats decay while the app is closed, with deterministic catch-up
  in 5-minute steps and a seeded RNG. Includes poop, sickness, overfeeding, bedtime, tantrums and
  discipline, care mistakes, life stages, Star/Normal/Grumpy evolution and death. A
  "While you were away…" card summarises what happened.
- **Petting:** tap to poke, slow swipe to stroke. Mood-driven faces and animations; particles.
- **3 mini-games** (Snack Catch, Rhythm Tap, Left or Right), coins, a cosmetics-only shop,
  21 achievements and a memorial for past pets.
- **Settings:** language, sound, vibration, low-power mode, bedtime, export/import save, and
  reset (asks twice).
- **PWA:** fully offline after the first load, custom install button (Android), iOS
  "Add to Home Screen" hint, and a "New version — tap to refresh" message.

### New in 0.4 — Learning lab

A 🔬 **Learning lab** in the menu (lazy-loaded) turns the care loop into real-world learning:

- **Wild cousins:** the real animal behind each pal — range map, diet, lifespan and IUCN Red
  List status, with the reason it is (or isn't) threatened.
- **Life cycle:** game stages next to the real animal's ages, plus one life-cycle fact.
- **Body book:** a page about food, play, sleep, hygiene, germs or medicine unlocks the first
  time the pet needs it. Need banners have a "Why?" button with a one-line explanation.
- **Food lab:** nutrition dots (sugar, protein, fibre, vitamins) for every food, and a weekly
  balanced-plate challenge (variety, enough meals, few treats).
- **Detective mode:** sickness now has a cause (dirt, hunger, too many snacks or just bad luck).
  The clues from that moment are recorded, and naming the cause pays coins.
- **Care experiments:** pick a hypothesis, compare 3 test days with a diary baseline, then judge
  the data (supported, not supported, unclear, or not a fair test).
- **Budget week:** a pretend 70-coin allowance for needs and wants, with a savings goal; leftover
  coins are paid out, but skipping needs doesn't count.
- **Report card:** weekly grades for consistency, response time, needs met and sleep routine,
  plus a real-life care tip for the species.
- **Feelings check-in:** once a day the pet asks how _you_ are and replies with a coping tip; for
  heavy feelings it suggests talking to someone (and 116 111). Stays on the device.
- **Word Snack packs:** food, animals, feelings, body, weather and school, with spaced repetition
  (missed words come back first) and a "challenge day" when the pet speaks only the other
  language.

### New in 0.3 — more pals, softer graphics

- **5 new species:** axolotl, penguin, owl, turtle and **Sparky**, an original electric creature
  that gives off little sparks when happy. Each has its own colors, background, voice, favourite
  food and 8 true facts (88 facts in total; Sparky's are about real electric animals).
- **Plush graphics:** velvety fur with sheen, glossy eyes with coloured irises, toe beans, soft
  studio lighting with procedural reflections and a small pedestal. Low-power mode keeps the
  lighter cel-shaded cartoon look.

### New in 0.2 — nicer, calmer, more educational

- **Real-world sky and seasons:** dawn, day, golden hour, dusk and a starry night follow the
  device clock; blossoms, summer sparkles, falling leaves or snow drift by. The pet yawns before
  bedtime.
- **Music and voices:** optional soft generated music (slower at night) and a voice for each
  species.
- **Photo mode and life album:** framed snapshots, plus automatic photos at hatching, each new
  stage and birthdays. Stored on the device (IndexedDB); each memorial pet keeps its album.
- **Gentle start:** the very first pet's needs drop at half speed for two days, and the pet
  explains which button helps.
- **Joy:** "I missed you!" when you come back, birthday gifts (days 1, 7, 14 and 30), a thank-you
  after a perfect day, and secret favourite foods per species.
- **Animal facts:** true facts, 8 per species (real reptiles for the dragon). The pet tells
  one a day; learned facts fill the encyclopedia, with a daily quiz for coins.
- **Bilingual mode:** the pet speaks both languages, and a fourth mini-game, **Word Snack**,
  practises English ↔ Czech vocabulary.
- **Healthy habits:** sweet versus healthy snacks, a "slept well in the dark" bonus, and a break
  reminder after 30 minutes of play.
- **Piggy bank:** 5 % compound interest every 3 days, with a savings chart.
- **Carer's diary:** a daily reflection (care given, missed calls, how the pet probably felt),
  plus "care together" save sharing.

## Develop

Requires Node 22+.

```bash
npm install
npm run dev          # http://localhost:5173/Tamagotchi/
```

| Script             | What it does                                                       |
| ------------------ | ------------------------------------------------------------------ |
| `npm run dev`      | Vite dev server (no service worker in dev)                         |
| `npm run build`    | Type check + production build into `dist/`                         |
| `npm run preview`  | Serve the production build (service worker active)                 |
| `npm run check`    | Everything CI runs: format, lint, typecheck, coverage, build, size |
| `npm test`         | Vitest unit tests                                                  |
| `npm run coverage` | Unit tests with coverage for `src/game` (threshold 80 %)           |
| `npm run e2e`      | Playwright smoke tests on a 390×844 mobile viewport (builds first) |
| `npm run size`     | Fails if first-screen JS exceeds 400 kB gzipped (after a build)    |
| `npm run icons`    | Regenerate PNG icons from `public/icons/icon.svg`                  |

Playwright needs a Chromium: run `npx playwright install chromium` once. If a Chromium is already
installed (for example in a sandbox), set `PW_CHROMIUM_PATH=/path/to/chrome` instead. This
applies to `npm run e2e` and `npm run icons`.

### Debugging

- `?debug=1` adds a 🐞 button with a 1× / 60× / 3 600× time multiplier, stat sliders, force
  sickness, skip stage, kill pet and clear save.
- `?gallery=1` shows every species side by side, with stage, mood, color and form switches.

## Deploy (static hosting)

The build is a static folder (`dist/`). By default it is built for GitHub Pages under
`/Tamagotchi/`.

**GitHub Pages (recommended):**

1. In the repository, go to **Settings → Pages → Build and deployment** and set Source to
   **GitHub Actions**.
2. Push to `main`. `.github/workflows/deploy.yml` runs all checks and the e2e tests, then
   publishes `dist/` to `https://<user>.github.io/Tamagotchi/`.

**Netlify or any root domain:** build with `BASE_PATH=/ npm run build`, then publish `dist/`.
The app has a single route, so no rewrite rules are needed.

Serve over HTTPS; service workers need it, except on `localhost`.

## Project structure

```
src/
  game/        pure TS engine: types, constants, simulation, rng, evolution, death, save/migrations
  store/       zustand store (persisted as "pocketpals:v1") + localStorage wrapper that never throws
  three/       R3F scene, procedural pet models, materials, animations, particles
  ui/          React screens, sheets and components (Tailwind)
  minigames/   lazy-loaded mini-games + their pure logic
  i18n/        en.ts, cs.ts (typed keys), translate + useT hook
  audio/       Web Audio synth (no audio files) + haptics
  pwa/         service worker registration, install prompt, update toast
tests/         Vitest unit tests (engine, i18n, formatting, mini-game logic)
e2e/           Playwright smoke tests
```

- **Balancing:** every number lives in `src/game/constants.ts`.
  `tests/game/scenarios.test.ts` simulates attentive, casual and careless players to keep the
  difficulty curve honest.
- **Learning content:** texts for the lab live in `src/i18n/learn/{en,cs}.ts` behind one typed
  interface, so a missing translation fails the type check; real-world data is in
  `src/game/wild.ts`.
- **Save format:** `src/game/save.ts` has `schemaVersion` and a migration table. Bump the
  version and add a migration whenever the shape changes.
- **Models:** each species is an entry in `MODEL_REGISTRY` (`src/three/PetModel.tsx`). A `.glb`
  component with the same props can replace any entry.
- **Push notifications** are not in the MVP (there is no backend). The hook point is noted in
  `src/pwa/registerSW.ts`.

## Notes

- **Storage on iOS:** Safari may clear data for sites not opened for 7 days unless the app is
  installed to the home screen. The app shows an early install hint and reminds players to
  export a backup.
- If `localStorage` is unavailable or full, the game keeps running in memory and shows a warning.
- **Performance:** device pixel ratio is capped at 2 (1 in low-power mode). Low-power mode also
  turns off particles and the shadow and switches to the cartoon look. If the plush look runs
  below about 28 fps, the app switches to the cartoon look automatically for that session. Rendering pauses while the page is hidden and runs on
  demand while sheets cover the pet. Mini-games and the shop load lazily, and three.js and React
  are split into long-cached vendor chunks.
