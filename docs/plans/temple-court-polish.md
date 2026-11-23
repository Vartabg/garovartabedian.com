# The overturned tables: tactile polish and closing teaching scene

Revision 2, against baseline `54f8c89d` (branch `codex/temple-court-polish`), incorporating independent EGM review findings.

## Goal and user direction

Garo played the real-time courtyard build at `/scriptures/stories/play/overturned-tables`, liked it, and approved a focused elevation pass combining tactile/visual/audio polish with a staged in-courtyard closing teaching scene:

- **Accepted**: the real-time freely walkable courtyard, immediate first flip beside table 1, warm limestone architectural print aesthetic, kickable coins, zero timers/points/combat, tactile physics/audio polish, and an in-courtyard closing scene for Mark 11:17–18.
- **Still open (out of scope for this pass)**: a separate John 2 livestock/whip lens, full-court roaming carrier traffic, a multi-episode anthology, and David/Valley of Elah.

## Scope and consequential decisions

All work stays inside `src/app/scriptures/stories/play/overturned-tables/`, its unit/E2E tests, and the design/plan notes under `docs/plans/`. No server writes, no persisted state, no external audio or image assets, and no changes to other games or site chrome.

### 1. Solid standing furniture, point-vs-AABB swept sliding, and deterministic waypoints (`courtGame.ts`)
- Standing money tables (`table`) and dove seats (`seat`) with `at === null` occupy axis-aligned floor footprints incorporating player clearance around their rendered leg bases:
  - `table`: `[f.x - 32, f.x + 34] × [f.y - 16, f.y + 4]`
  - `seat`: `[f.x - 20, f.x + 22] × [f.y - 12, f.y + 4]`
  - `gate` (East passage) remains an open walkable threshold.
- Player collision is defined strictly as the 2D feet point `(player.x, player.y)` against standing obstacle rectangles.
- `move()` resolves manual movement with exact analytical piecewise-linear swept AABB sliding: compute exact entry time `tEnter ∈ [0, 1]`, advance to the face, zero the blocked axis, compute exact corner-exit time `tExit` along the open axis, and continue with the remaining displacement. This preserves exact `30 Hz` vs `120 Hz` determinism (`< 1e-6`).
- `approach()` and `walkTo()` compute a static deterministic waypoint route (`route: Point[]`) at call time when a standing obstacle intersects the direct path to the destination (routing via the nearer top/bottom corner clearance `minY - 2` or `maxY + 2`, clamped to `WALK_BOUNDS`), and `walkTo()` projects destinations inside a standing box out to its nearest edge. Overturning a fixture immediately removes its obstacle footprint.
- Every standing footprint stays well inside `REACH = 62` (`max distance <= 38.1`), so every approach angle reaches the fixture cleanly.

### 2. Physical aftermath, bounded coins, feathers, and multi-pass layering (`courtCoins.ts`, `courtProps.ts`, `courtGame.ts`, `courtView.ts`)
- **Bounded coins**: `stirCoins()` clamps coin positions to courtyard paving (`x ∈ [22, COURT_WIDTH - 22]`, `y ∈ [178, 424]`) with soft velocity rebound (`-0.45`) so coins never skate onto the rear steps/wall or off-canvas.
- **Coin-kick feedback**: `stirCoins()` returns whether any coin was newly kicked, updating `court.coinKickAt` so the controller can trigger a soft rate-limited metallic chink (`>= 100 ms`).
- **Tumbling table props**: overturning a table no longer makes its teal cloth runner and brass balance scale vanish; deterministic physical arcs toss the cloth crumpled onto the paving and bounce/settle the brass scale beam and pans beside the overturned table (clamped to `y ∈ [178, 424]`).
- **Drifting dove feathers & complete bird exit**: overturning a dove seat spawns 5 light feathers (`fixture.feathers`, simulated alongside coins in `courtCoins.ts`) that drift down in slow glides, settle inside `y ∈ [178, 424]`, and flutter gently upward if Jesus walks over them. Airborne doves arc upward until clearing the top of the courtyard (`y < -28`, fade fallback only after `t > 5.5`), eliminating the mid-air pop-out at `t > 3.2`.
- **Explicit multi-pass rendering (`courtProps.ts`, `courtView.ts`)**:
  1. `drawGroundScatter`: settled coins (`z < 2`), settled feathers (`z < 2`), fallen cloth runners, and settled brass scales drawn directly on the paving beneath actors.
  2. Depth-sorted actor pass: standing/tipping fixtures, mid-air coins/feathers (`z >= 2`), falling cloths/scales, sellers, buyers, carrier, listeners, scribes, and Jesus sorted by `y`.
  3. `drawAerialSpill`: soaring doves, brief impact flash, and limestone dust puffs drawn above ground actors so characters never occlude airborne birds.

### 3. Impact weight, distinct poses, and grounded crowd choreography (`courtPeople.ts`, `courtView.ts`, `courtGame.ts`)
- **Action kinds on `Court`**: track `actionKind: 'shove' | 'halt' | 'teach' | 'air'` alongside `shoveAt`:
  - `table` / `seat` / `air` use the forward shove pose.
  - `gate` uses an upright, open-handed **halting gesture** facing the east archway.
  - `teach` (post-completion action) uses a calm open-handed speaking gesture.
- **Render-decoupled visual impact weight (disabled under `prefers-reduced-motion`)**: `courtView.ts` applies a `35 ms` visual hit-stop on table/seat impact (holding visual impact animation time without altering `courtGame.ts` simulation stepping), damped 2–3 px camera thud, warm limestone dust puffs where timber meets paving, and a crisp settle bounce on table rotation.
- **Reactive sellers and architectural exits**:
  - Standing merchants and buyers have subtle idle breathing/shift motion; merchants within ~260 px of a newly overturned stall glance/lean back in startle.
  - Fleeing sellers and departing buyers exit cleanly toward the west edge, the east archway opening, or the nearest open rear arcade arch (never walking straight into solid masonry columns).
- **East passage carrier**:
  - While the passage is open, the carrier descends from the east archway steps into the eastern court with their amphora and loops back out—making Mark 11:16 visually legible.
  - Preserved invariant: barring the east passage still works at ANY animation phase once within `REACH = 62` of the fixed threshold (`1185, 270`), with zero timing window.
  - Once barred, the carrier checks their stride, steadies the amphora, turns around, and retreats up the steps and out through the east archway.

### 4. Procedural market-to-stillness soundscape with pause/mute lifecycle (`courtSound.ts`, `courtController.ts`)
- All audio remains pure Web Audio API, unlocked strictly on user gesture, routed through a `masterGain` node (plus a dedicated `ambientGain` feeding `masterGain`), and fail-safe when `AudioContext` is unavailable.
- Expose `play(kind: 'table' | 'seat' | 'gate' | 'air' | 'teach' | 'coin' | 'step')`, `setEnabled(enabled: boolean)`, `setPaused(paused: boolean)`, `updateAmbiance(remainingStalls: number, barred: boolean)`, and `close()`.
- `courtController.ts` dispatches `sound.play('teach')` when `s.actionKind === 'teach'`, calls `sound.setPaused(paused)` inside `pause()`/`togglePause()`/`visibilitychange`, updates ambient intensity in `change()` and `reset()`, triggers rate-limited `'coin'` kicks from `s.coinKickAt`, and triggers soft `'step'` taps on walking stride crossings.
- Ambient market bed (filtered courtyard murmur + sparse distant coos while dove seats stand + faint coin taps while tables stand) scales down stall-by-stall (`5 -> 0`) into open stillness at completion; all ambient timers and nodes stop cleanly on pause, visibility loss, mute, and `dispose()`.

### 5. Closing teaching scene and HUD contract (`courtGame.ts`, `courtController.ts`, `courtView.ts`, `TempleGame.tsx`, `TempleReading.tsx`, `temple.css`)
- Upon clearing all 5 stalls and barring the east passage (`courtComplete(s) === true`):
  - Warm slanting sunlight softens across the open limestone paving (instant under reduced motion).
  - Four quiet listeners walk in from the west end and open arches to pause at a respectful semicircle in the cleared floor, turning gently toward Jesus as he walks.
  - Two dark-robed chief priests/scribes step into view near the shaded colonnade column bases (`y ≈ 196–204`) so they stay framed even on short mobile landscape viewports (Mark 11:18).
- **Teaching beats & HUD propagation**:
  - Add `teachingStep: 0 | 1 | 2` on `Court` (0: *"My house will be called a house of prayer for all the nations."*, Mark 11:17; 1: *"But you have made it a den of robbers!"*, Mark 11:17; 2: *"All the multitude was astonished at his teaching."*, Mark 11:18 — WEB text).
  - `readHud(s)` exposes `teachingStep: s.teachingStep` and computes `action: courtComplete(s) ? "Teach" : near ? actions[near.kind] : "Shove"`.
  - `publish()` checks `teachingStep` alongside `revision === s.seq` and `nearId === near`.
  - Post-completion `act(s)` increments `s.seq`, sets `s.actionKind = 'teach'`, advances `s.teachingStep = (s.teachingStep + 1) % 3`, and updates `s.message` with the spoken line. Passive roaming after completion does NOT alter `s.seq`.
  - `TempleGame.tsx` preserves `<h2>A house of prayer</h2>` and dynamically renders the active quote + Mark 11:17/18 link for `hud.teachingStep`.
- Update `TempleReading.tsx` (one sentence) and `docs/plans/playable-stories-design.md` to record Garo's acceptance and keep the Scripture-vs-adaptation boundary explicit.

## Observable acceptance checks

1. **Unit tests (`tests/overturned-tables.test.ts`)**:
   - All 8 existing tests pass unchanged.
   - New unit tests verify: standing table footprint blocks ghosting and slides cleanly with exact 30/120 Hz agreement; overturning opens the floor; `approach()` routes cleanly around an intervening standing stall; coins stay bounded inside courtyard paving (`178..424`) and update `coinKickAt` when walked over; dove seats spawn drifting/kickable feathers; barring the gate sets `actionKind === 'halt'`; post-clear `act()` sets `actionKind === 'teach'` and cycles `teachingStep` without breaking completion or replay.
2. **E2E tests (`tests/e2e/playable-stories-navigation.spec.ts`)**:
   - All existing navigation, early/late passage barring, replay, and no-JS tests pass.
   - Post-clear primary button updates to `Teach`, advances the Mark 11:17–18 teaching copy when pressed, and resets to `Flip table` on `Play again`.
3. **Repository checks & visual browser inspection**:
   - `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, targeted `test:e2e`, and `test:a11y` on `/scriptures/stories/play/overturned-tables`.
   - Local browser inspection at desktop and mobile (portrait & short landscape) across opening state, overturned aftermath, east passage halt, and cleared teaching scene.
