# The Storm on the Lake: playable Sea of Galilee vignette (Mark 4:35–41)

Revision 2, against baseline `64e39a70` (branch `codex/storm-on-the-lake`), incorporating all independent EGM review findings and built directly on `src/app/scriptures/stories/play/_shared/`.

## Goal and user direction

Build Episode 3 of the 2D playable Scripture stories at `/scriptures/stories/play/storm-on-the-lake` (Mark 4:35–41; parallel Matthew 8:23–27, Luke 8:22–25):

- Place the player aboard a first-century Galilean cedar fishing boat crossing the Sea of Galilee at evening alongside companion boats, with Jesus asleep on a cushion in the stern.
- Five deterministic phases:
  1. **`launch`** (Mark 4:35–36): set the square linen sail (`sail`) and pull the oars (`oars`) in any order as evening deepens.
  2. **`squall`** (Mark 4:37): fight headwind resistance across the pitching wooden planks to drop the straining sail (`reef`) and bail water from bow (`bail-1`) and midship (`bail-2`) — feeling waves fill the boat faster than fishermen can bail.
  3. **`wake`** (Mark 4:38): walk aft to the stern (`stern`) to wake Jesus asleep on the cushion.
  4. **`rebuke`** (Mark 4:39): untimed turning point — Jesus stands upright in the stern facing the storm; activating **`Speak to the sea`** (`still`) cuts the roaring gale into glassy moonlit stillness (`< 0.25 s` acoustic cut + wave/rain flattening).
  5. **`calm`** (Mark 4:39–41): walk freely from stern to bow under moonlight and stars, cycle verbatim Mark 4:39–41 verses (`Read verse`), or replay cleanly.
- **Guardrails**: Zero countdown timers, zero QTEs, zero fail states, zero points, zero external runtime assets, zero persisted state. Uses non-colliding macOS APFS filenames: `stormGame.ts`, `StormStage.tsx`, `StormReading.tsx` (never `StormGame.tsx`).

## Key engineering contracts (incorporating EGM review)

1. **Boat-local coordinate space & inverse pitch projection**:
   - `STORM_WIDTH = 1280`, `STORM_HEIGHT = 460`, boat-local walkable deck `DECK_BOUNDS = { minX: 432, maxX: 838, minY: 286, maxY: 326 }`.
   - Visual boat pitch/heave rotates around `(625, 320)`. `toWorld(clientX, clientY)` applies the exact inverse transform `R(-pitch)` + `y - heave` (identity under `prefers-reduced-motion`) so taps on the pitching deck, mast, bailing wells, and stern Jesus hit-test with pixel accuracy.
2. **Deterministic headwind speed & 30/120 Hz `< 1e-6` arrival**:
   - Calm / launch speed: `220 px/s`. During squall / wake / rebuke (`stormIntensity > 0`): `dx > EPSILON ? 146 : dx < -EPSILON ? 232 : 200 px/s`.
   - Sub-frame exact arrival interpolation (`arrivalTime = start + walked / speed`) guarantees `< 1e-6` agreement between 30 Hz and 120 Hz for both position and event timestamps.
3. **Discrete task tracking & responsive `act()`**:
   - Five discrete tasks (`sail`, `oars` in `launch`; `reef`, `bail-1`, `bail-2` in `squall`) tracked via `at: number | null` on `s.tasks`. Premature `approach(s, 'stern')` while `phase !== 'wake'` is ignored.
   - Calling `act(s)` in `launch`/`squall`/`wake`: triggers an in-reach active task immediately, or smoothly starts `approach()` toward the nearest remaining active task.
4. **Sharp `< 0.25 s` storm-to-calm audio cut**:
   - `_shared/storyAudio.ts` accepts optional `rampSeconds = 0.28` on `setAmbientTarget(gain, rampSeconds)` (100% backwards-compatible). On `still`, `stormSound.ts` calls `engine.setAmbientTarget(0, 0.035)` (attenuating by > 40 dB within `0.20 s`) and keeps periodic surf bursts compact (`<= 0.32 s`), followed by a warm open-fifth stillness chord and soft calm water laps.
5. **Short Safari landscape framing**:
   - `verticalCameraTop(visibleHeight, feetY)` uses `fitVerticalCamera(STORM_HEIGHT, 412, 128, 0.77, visibleHeight, feetY)` in world units (`height / scale`), guaranteeing full visibility of the active boat deck (`286..326`), player feet/head, oar bench, bailing wells, and sleeping/standing Jesus on `129 CSS px` short Safari landscape screens (upper mast tip clips gracefully on extreme landscape aspect ratios).
6. **Site registration & dark-mode accessibility**:
   - Register `/scriptures/stories/play/storm-on-the-lake` in `site-navigation.ts`, `study-catalog.ts`, `play/page.tsx` (with `/jesus/life/calming-the-storm.jpg` `1280×720` and explicit `alt`), `scripts/a11y/config.mjs` (96 routes), `tests/a11y-runner.test.ts`, and `public/meta/site-xray.json`.
   - `.storm-page` enforces explicit `background: #f6eedf; color: #352e26;`, `.storm-reading blockquote` enforces `background: transparent; color: #4f4032;`, `.storm-page a` enforces `text-decoration: underline`, and compact short-landscape `.storm-card` (`max-width: min(16.5rem, 39%)`).

## Observable acceptance checks
1. `tests/storm-on-the-lake.test.ts` covers launch/squall out-of-order tasks, headwind asymmetric east/west speed, premature stern guard, 30/120 Hz `< 1e-6` determinism, untimed rebuke persistence (60 s), sharp calm state reset, 3-step `CALM_VERSES` cycling, clean replay, inverse boat pitch projection round-trip, and short Safari landscape headroom.
2. `tests/a11y-runner.test.ts`, `tests/scripture-study-catalog.test.ts`, `tests/sitemap.test.ts`, `tests/site-xray.test.ts`, and `tests/e2e/playable-stories-navigation.spec.ts` (including updated hub no-JS 320px + full Storm on the Lake playthrough + no-JS Mark 4 reading) pass.
3. Live desktop (`1280×800`), mobile portrait (`390×844`), and short mobile landscape (`750×360`) screenshots visually inspected across launch, squall, rebuke, and moonlit calm, plus 0 Axe WCAG 2.2 AA violations in light and dark schemes.
