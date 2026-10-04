# CLAUDE.md — "Pocket Pals" 3D Tamagotchi PWA

## 0. Kickoff rules for Claude Code
- Read this whole file before writing code.
- Before scaffolding, list any ambiguities or risky assumptions and **ask the user** to confirm them. Do not guess on: app name, art direction changes, adding any dependency not listed below.
- Work in the milestones from section 12, in order. After each milestone: run tests, run a production build, summarize what changed, and wait for the user's go-ahead.
- Keep game logic pure and framework-free so it is unit-testable.

## 1. Product summary
A colorful, mobile-first 3D virtual-pet game (classic Tamagotchi loop) installable as a PWA. The player picks an animal, hatches it from an egg, and keeps it alive by feeding, playing, cleaning, putting it to sleep and curing it. Neglect leads to sickness and, eventually, **death** (classic rules). Everything is stored on-device in `localStorage`; there is no backend, no accounts, no analytics.

- **Target players:** teens (13–17). Tone: playful, a bit cheeky, not babyish. Mechanics can have real stakes.
- **Platform:** mobile phones (iOS Safari + Android Chrome), portrait orientation. Desktop should work but is not optimized.
- **Languages:** English and Czech, switchable at any time.

## 2. Tech stack (do not swap without asking)
| Concern | Choice |
|---|---|
| Build | Vite + TypeScript (strict) |
| UI | React 18 |
| 3D | three.js via `@react-three/fiber` + `@react-three/drei` |
| State | `zustand` with `persist` middleware → `localStorage` |
| PWA | `vite-plugin-pwa` (Workbox, `generateSW`, autoUpdate) |
| Styling | Tailwind CSS |
| i18n | Tiny in-house dictionary + `Intl.PluralRules` (no i18n library) |
| Tests | Vitest (logic), Playwright (one smoke test on mobile viewport) |
| Lint/format | ESLint + Prettier |

No other runtime dependencies without approval. No external network calls at runtime.

## 3. Pets
At least **6 selectable species**, each in **3 color variants** chosen on the selection screen:
cat, dog, bunny, fox, panda, baby dragon (stretch: axolotl, penguin).

### 3D art direction
- Models are **built procedurally from primitives** (spheres, capsules, cones, tori) in code: chibi proportions (big head, small body), no downloaded assets. This keeps the bundle small and avoids licensing issues. Structure the code so a `.glb` could replace a procedural model later.
- Materials: `MeshToonMaterial` with a 3-step gradient map for a cel-shaded look; soft contact shadow under the pet (`<ContactShadows>`).
- Palette: saturated candy colors on pastel gradient backgrounds; each species has its own background theme.
- Animation (code-driven, no rigs needed): idle breathing (scale bob), blinking, squash-and-stretch on tap, happy hop, sad droop, sleeping (eyes closed + "Zzz" sprites), eating chomp, sick (green tint + wobble), dirty (stink-line particles).
- Facial expression changes via eye/mouth meshes swapped by mood.
- Particle effects: hearts, sparkles, bubbles, food crumbs.
- Life-stage visuals: each stage scales the model and adds features (e.g., dragon wings grow at teen stage).

## 4. Core stats and simulation
All stats are integers 0–100. The simulation runs on **real elapsed time** using timestamps, so the pet keeps living while the app is closed.

| Stat | Decay (awake) | Decay (asleep) | Restored by |
|---|---|---|---|
| Hunger (fullness) | −6 / h | −2 / h | Meal +30, snack +10 |
| Happiness | −5 / h | −1 / h | Play, mini-games, petting, snack |
| Energy | −4 / h | +12 / h | Sleeping |
| Hygiene | −3 / h, −15 per uncleaned poop | −1 / h | Clean / bath |
| Health | see rules below | | Medicine, good care |

Additional rules:
- **Poop:** random every 2–4 h awake; each uncleaned poop also drains happiness 2 / h.
- **Overfeeding:** more than 4 snacks within 2 h → chance of getting sick.
- **Sickness:** chance per hour rises when hygiene < 25 or hunger < 15. Sick pets lose health 4 / h until given medicine (1–2 doses).
- **Health:** loses 2 / h for every stat below 20; regenerates 1 / h when all stats ≥ 50 and not sick.
- **Sleep:** pet gets sleepy at a bedtime the player sets (default 22:00–07:00). Player must turn lights off; lights left on → happiness −3 / h. Waking a sleeping pet → happiness −10.
- **Attention calls / discipline (teen-level depth):** occasionally the pet "acts up" (refuses food, beeps for no reason). Player can scold (discipline +) or ignore. Discipline affects evolution.

### Offline catch-up
- Store `lastTickAt`. On open/resume, simulate from `lastTickAt` to `now` in 5-minute steps (cap at 14 days; beyond that, treat the pet as dead from neglect).
- Use a seeded RNG (seed stored in state) so catch-up results are deterministic and testable.
- Show a **"While you were away…"** summary card (stats change, poops, got sick, etc.).
- While open, tick every 10 s; pause rendering and ticking on `visibilitychange` hidden, then catch up on visible.

## 5. Life cycle, evolution and death
| Stage | Duration (real time) |
|---|---|
| Egg | 5 min (tap to warm = faster hatch) |
| Baby | 1 day |
| Child | 2 days |
| Teen | 3 days |
| Adult | 7 days |
| Senior | 3–5 days |

- **Evolution:** at each stage change, compute a care score (average stats over the stage, number of care mistakes, discipline). It decides the next form: "Star" (great care), "Normal", or "Grumpy" (poor care). Different forms = different accessories/colors/expressions per species.
- **Care mistake:** a call (stat < 20) not answered within 15 min.
- **Death (classic):** the pet dies when health reaches 0, or when any stat sits at 0 for more than 12 h continuous, or of old age at the end of the senior stage.
- **Warnings before death:** critical-state visuals, a red pulse UI, and in-app banner when health < 25. No surprise deaths without warnings visible on the last open.
- **After death:** respectful, slightly bittersweet scene (ghost floats up, tombstone). Save the pet to a **Memorial** (name, species, form, age, cause, date). Then offer a new egg. Do not make death gory or mocking.

## 6. Gameplay features
- **Pet selection:** carousel of 3D species with color picker and a name input (max 12 chars, profanity not filtered — local game).
- **Main screen:** 3D pet center stage, stat bars on top, action bar at the bottom: Feed, Play, Clean, Lights, Medicine, Stats. Large thumb-friendly buttons (≥ 48 px).
- **Petting:** tap = poke reaction; slow swipe over the pet = stroke (happiness +2, rate-limited).
- **Mini-games (pick 2 for MVP):** (a) "Snack Catch" — tilt or drag to catch falling food; (b) "Rhythm Tap" — tap on beat; (c) "Left or Right" guessing game (classic). Rewards: happiness + coins. Each game lasts under 60 s.
- **Coins and shop:** earn coins from mini-games and long survival; spend on cosmetics only (hats, glasses, scarves, backgrounds). No real money, no ads.
- **Achievements:** ~15 simple badges (first hatch, reach adult, 7-day streak, perfect care day…).
- **Memorial / graveyard:** list of past pets with stats.
- **Settings:** language toggle, sound on/off, haptics on/off, bedtime, low-power mode, export/import save, reset game (double confirm).

## 7. Storage
- Single persisted store key, e.g. `pocketpals:v1`. Include `schemaVersion` and a migration function from day one.
- Keep the saved object small (no huge arrays; cap event log to last 50 entries).
- **Export / import** the save as a JSON file (download + file picker) so players can back up.
- **Important iOS caveat:** Safari may wipe `localStorage` for sites not used for 7 days unless the app is installed to the home screen. Show an install prompt early and explain this in one friendly sentence; also remind about export.
- Handle `localStorage` being unavailable or full: catch errors, show a non-blocking warning, keep playing in memory.

## 8. PWA requirements
- Web app manifest: name, short_name, theme/background colors, `display: standalone`, `orientation: portrait`, maskable icons (192, 512) generated from a simple procedural pet icon (SVG source in repo).
- Service worker precaches the full app shell; game must work **100% offline** after first load.
- Custom install button (Android `beforeinstallprompt`); for iOS show a small "Share → Add to Home Screen" hint.
- Update flow: when a new version is available, show "New version — tap to refresh".
- No push notifications in MVP (no backend). Note in code where they could be added later.

## 9. Mobile performance and UX
- Target 60 fps on a mid-range Android phone; cap `dpr` at 2; low-power mode caps at 1 and disables shadows/particles.
- Use `frameloop="demand"` when idle animations are not needed; pause the canvas when the page is hidden.
- Respect safe-area insets (`env(safe-area-inset-*)`), prevent pull-to-refresh and double-tap zoom on the game area, no text selection on buttons.
- Haptics via `navigator.vibrate` where supported (Android); fail silently elsewhere.
- Sound: short effects synthesized with Web Audio (no audio files); start only after first user gesture; mute toggle.
- Accessibility: stat bars have text labels and ARIA values; respect `prefers-reduced-motion` (reduce bouncing and particles); color is never the only indicator of state.
- Initial JS bundle goal: under 400 kB gzipped. Lazy-load mini-games and the shop.

## 10. Internationalization
- Locales: `en`, `cs`. Default from `navigator.language` (anything starting with `cs` → Czech), overridable in Settings, persisted.
- All UI strings in `src/i18n/{en,cs}.ts`, typed keys so a missing translation fails the type check.
- Czech plurals have 3+ forms (1 / 2–4 / 5+): use `Intl.PluralRules` for counts (days, coins, poops).
- Format numbers and dates with `Intl` using the active locale. Pet names are never translated.
- Tone in Czech: casual, use "ty" form.

## 11. Project structure
```
src/
  game/            # pure TS: types, constants, simulation, rng, evolution, death, migrations
  store/           # zustand store + persist config
  three/           # R3F scene, procedural pet models, materials, animations, particles
  ui/              # React screens and components (Tailwind)
  minigames/       # each mini-game lazy-loaded
  i18n/            # en.ts, cs.ts, useT hook
  audio/           # Web Audio synth helpers
  pwa/             # install prompt, update toast
tests/
```
- All balancing numbers live in `src/game/constants.ts` so they can be tuned in one place.
- Add a hidden **debug panel** (enabled with `?debug=1`): time multiplier (1×, 60×, 3 600×), set stats, force sickness, skip stage, kill pet, clear save.

## 12. Milestones
1. **Scaffold:** Vite + React + TS + Tailwind + PWA plugin, offline-capable empty shell, i18n skeleton, lint/test setup.
2. **Game engine:** pure simulation (stats, decay, poop, sickness, sleep, offline catch-up, evolution, death) with Vitest coverage ≥ 80 % for `src/game`.
3. **3D pets:** procedural models for all 6 species with color variants, idle + mood animations, selection carousel.
4. **Main loop UI:** stat bars, actions, petting, lights, "while you were away" summary, warnings, death + memorial.
5. **Mini-games, coins, shop, achievements.**
6. **Polish:** sound, haptics, particles, low-power mode, accessibility, install/update UX, export/import.
7. **Hardening:** performance pass on mobile, Playwright smoke test (390×844 viewport), Lighthouse PWA check, README with run/deploy steps (static hosting, e.g. GitHub Pages or Netlify).

## 13. Definition of done
- Installs to home screen on iOS and Android and runs fully offline.
- Closing the app for 8 hours and reopening shows correct, deterministic stat changes and a summary.
- A neglected pet visibly warns, gets sick, and eventually dies; an attended pet reaches adult and evolves into a form matching care quality.
- Language switch updates every string instantly, including plurals.
- Save survives reload, can be exported and re-imported.
- No console errors; production build passes lint, type check and tests.
