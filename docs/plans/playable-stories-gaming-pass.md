# Playable 2D Scripture Stories — Expert Engineering & Gaming Pass (Rev 2)

Baseline commit: `7afa53cb` (`master`).
Scope: `_shared/` 2D engine primitives and all three 2D playable Scripture stories (`/scriptures/stories/play/storm-on-the-lake`, `/scriptures/stories/play/valley-of-elah`, `/scriptures/stories/play/overturned-tables`), delivered as four cleanly bisectable PR units.

## Goals & Non-Negotiable Constraints

1. **Preserve every accepted Scripture & accessibility contract:**
   - Verbatim World English Bible quotes and links stay untouched; Scripture stays clearly separated from imagined play.
   - Zero countdown timers, zero fail states, zero scores, zero dexterity locks. Every phase remains 100% playable via keyboard (`WASD`/Arrows + `Space`/`Enter` + `P`), touch drag/tap, mouse hover/click, and the accessible target disclosure buttons (*Boat targets*, *Valley targets*, *Courtyard targets*).
   - `prefers-reduced-motion: reduce` disables hit-stop, camera shake, violent wave pitching, dust bursts, and rapid motion while keeping complete visual clarity.
   - **Determinism & visual separation:** Hit-stop and camera shake live strictly in the renderer/view layer (`stormView.ts`, `elahView.ts`, `courtView.ts`) and NEVER mutate simulation `dt`. Player movement and auto-walk arrival timestamps remain exact between `30 Hz` and `120 Hz` within `< 1e-6`, and stall frames remain capped (`dt <= 0.05`).
   - Zero public route change under `_shared/`; zero Axe WCAG 2.2 AA violations (light & dark); clean `site-xray.json` and 96-route a11y coverage.

2. **Shared engineering contract (`_shared/`):**
   - **Bounded `Path2D` cache (`storyInk.ts`):** Cap `blocks` at `MAX_CACHED_PATHS = 512` (FIFO eviction of oldest key when full). Add `printDynamic(ctx, d, fill, stroke, width)` for per-frame animated SVG curves (never inserts into `blocks`), plus `inkCacheSize()` and `clearInkCache()` for tests.
   - **Shared tactile HUD drawings (`storyInk.ts`):**
     - `drawHoverRing(ctx, x, y, rx, ry, color?)`: subtle etched highlight ellipse in world space on hovered interactive targets.
     - `drawDragCompass(ctx, drag, reduced)`: drawn in CSS-pixel canvas space (after `ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)`) ONLY when `drag.active` is `true` (which becomes `true` only once pointer drift exceeds the `8 px` drag threshold, so quick taps never flash it).
   - **Analytic velocity & `dt`-driven input buffering (`storyMotion.ts`):**
     - `integrateVelocity(v, target, accelRate, dt)`: guards `dt <= 0` or `accelRate <= 0`; snaps `v = 0` when `v * target < 0` (crisp zero-slide reversal on frame 1); computes exact closed-form `e = Math.exp(-accelRate * dt)`, `nextV = target + (v - target) * e`, `dx = target * dt + (v - target) * (1 - e) / accelRate`. Exact to `< 1e-12` under arbitrary step subdivision for constant `target`. Clamped axes zero their velocity component (`vx = 0` / `vy = 0`), and `approach`/`walkTo`/phase transitions reset `vx = vy = 0`.
     - `createActionBuffer(windowSec = 0.14)`: deterministic `dt`-driven buffer exposing `{ arm(), clear(), isArmed(), tick(dt, tryImmediate, onExpire) }`. Cleared on pause, reset, and phase changes. Controllers buffer ONLY when the player is actively moving (`s.walking || s.destination !== null`) and outside immediate reach; standing still invokes `act(s)` synchronously so Storm's auto-walk and Elah's `"Step closer..."` hint remain immediate.
   - **Idle-pause rAF stop/wake, live DPR, hover cursor & hold-to-charge handshake (`storyStage.ts`, `storyPointer.ts`):**
     - **Lifecycle:** Track `disposed = false` and `frame = 0`. `ensureFrame()` no-ops if `disposed || frame !== 0`. `animate(now)` clears `frame = 0` BEFORE invoking `onStep`/`onDraw` (safe for re-entrant `requestPaint()`). After painting, reschedules via `ensureFrame()` ONLY when `!paused && !document.hidden`; otherwise resets `last = 0` and goes completely idle (`0` rAF frames queued while paused/hidden). `setPaused(true)` cancels any queued `frame` when `!dirtyPaint`; `setPaused(false)`, visible `visibilitychange`, `requestPaint()`, `ResizeObserver`, `contextrestored`, and DPR change wake via `ensureFrame()`.
     - **Live DPR:** Guard `typeof window.matchMedia === 'function'` and `mql.addEventListener`; listen to `(resolution: ${dpr}dppx)` with `{ once: true, signal: stop.signal }`, re-arming on change and calling `hooks.onResize?.(); dirtyPaint = true; ensureFrame();`.
     - **Hover & semantic cursor:** In `storyPointer.ts`, ignore `e.pointerType === 'touch'` for hover; on mouse/pen `pointermove` (when not dragging) call `onHover?.(worldPt)` -> `boolean`, setting `canvas.style.cursor = hit ? 'pointer' : 'default'`. Reset hover (`onHover?.(undefined)` + `cursor = 'default'`) on `pointerleave` and `clearInput()` (pause/blur). Remove `cursor: crosshair` from all three CSS files.
     - **Hold-to-charge capture contract (keyboard & pointer):**
       - Keyboard (`storyStage.ts`): On non-repeat `Space`/`Enter` when `!target?.closest('button')` and `isActive()`, if `hooks.onActionDown?.()` returns `true`, set `actionHeld = true` and suppress `onPerform()`. On `keyup` (`Space`/`Enter`), fire `hooks.onActionUp?.()` ONLY if `actionHeld` was `true` (resetting `actionHeld = false`). On `clearInput()` (pause/blur/hidden/dispose), if `actionHeld` was `true`, reset `actionHeld = false` and fire `hooks.onActionCancel?.()` (never `onActionUp`). Eliminates `approach → sling` keyup bleed and HUD button keyup bleed.
       - Pointer (`storyPointer.ts`): Optional `onHoldStart?: (pt: WorldPoint) => boolean`, `onHoldEnd?: () => void`, `onHoldCancel?: () => void`. On `pointerdown`, if `onHoldStart?.(worldPt)` returns `true`, set `holding = true`. If drift reaches `>= 8 px` (`drag.moved = true`) or `pointercancel`/`lostpointercapture`/`clear()`, reset `holding = false` and invoke `onHoldCancel?.()` (transitioning cleanly into drag-steering without firing!). On clean `pointerup` with `holding === true`, reset `holding = false` and invoke `onHoldEnd?.()` (suppressing `onTap`).
   - **Broadcast-grade Web Audio (`storyAudio.ts`):**
     - **Master limiter:** Feature-detect `typeof audio.createDynamicsCompressor === 'function'`; route `master -> compressor (-12 dB, knee 12, ratio 6, attack 0.003, release 0.15) -> destination`, falling back to `master -> destination` on minimal/mock contexts.
     - **Click-free delayed `suspend()`:** Ramp `master.gain` down (`timeConstant = 0.015`) and schedule `suspendTimer = setTimeout(..., 75)` which re-checks `audio && audio.state === 'running' && (!enabled || paused)` before calling `audio.suspend()`. Cancel `suspendTimer` immediately on resume (`open === true`) and in `close()`.
     - **Pre-unlock ambient filter caching:** Retain `ambientFilter`, `ambientFreqTarget`, `ambientQTarget` in closure state. Initialize `filter.frequency.value = ambientFreqTarget` and `filter.Q.value = ambientQTarget` inside `startAmbient()`. `setAmbientFilter(freq, q?, rampSeconds?)` updates cached targets immediately (even before `unlock()`) and applies via `setTargetAtTime` when available, falling back to `.value = ...`.
     - **Warm voicing:** Add optional `detuneCents = 0` parameter to `tone(...)` (applied when `osc.detune` is present).

---

## Unit-by-Unit File Lists & Gameplay Architecture

### Unit 1: `_shared/` Engine Upgrade (`codex/playable-stories-engine-pass`)
- **Files:**
  - `docs/plans/playable-stories-gaming-pass.md` & `docs/plans/playable-stories-gaming-pass-review.md`
  - `src/app/scriptures/stories/play/_shared/storyInk.ts`
  - `src/app/scriptures/stories/play/_shared/storyMotion.ts` (new)
  - `src/app/scriptures/stories/play/_shared/storyPointer.ts`
  - `src/app/scriptures/stories/play/_shared/storyStage.ts`
  - `src/app/scriptures/stories/play/_shared/storyAudio.ts`
  - `tests/playable-story-shared.test.ts`

### Unit 2: *The Storm on the Lake* Gaming & Wave-Physics Pass (`codex/storm-gaming-pass`)
- **Files:**
  - `src/app/scriptures/stories/play/storm-on-the-lake/stormGame.ts`
  - `src/app/scriptures/stories/play/storm-on-the-lake/stormScenery.ts`
  - `src/app/scriptures/stories/play/storm-on-the-lake/stormBoat.ts`
  - `src/app/scriptures/stories/play/storm-on-the-lake/stormView.ts`
  - `src/app/scriptures/stories/play/storm-on-the-lake/stormSound.ts`
  - `src/app/scriptures/stories/play/storm-on-the-lake/stormController.ts`
  - `src/app/scriptures/stories/play/storm-on-the-lake/storm.css`
  - `tests/storm-on-the-lake.test.ts`
- **State & Physics Specification:**
  - `StormState` adds `vx: number`, `vy: number`, `sailSetAt: number | null`, `pendingWave: { at: number; targetWater: number } | null`, `lastWaveHitAt: number`, `waveHitSeq: number`, `calmFromIntensity: number`.
  - **Deterministic rogue-wave schedule (all 6 squall task orders safe):**
    - Water target by `squallDoneCount(s)`: `1 -> 0.62`, `2 -> 0.78`, `3 -> 0.90`.
    - When a bail task completes (`bail-1` or `bail-2`): if `s.pendingWave` is already queued, first settle `s.waterLevel = Math.max(s.waterLevel, s.pendingWave.targetWater)` so rapid `bail-1 → bail-2` never drops the first surge; then drop `s.waterLevel = Math.max(0.14, s.waterLevel - 0.22)` and schedule `s.pendingWave = { at: at + 0.75, targetWater: targetForDone(done) }`.
    - When `reef` completes: if `s.pendingWave` is already queued, keep it with `targetWater = Math.max(s.pendingWave.targetWater, targetForDone(done))`; otherwise raise `s.waterLevel = Math.max(s.waterLevel, targetForDone(done))`.
    - In `stepStorm`: when `s.pendingWave && s.calmedAt === null && s.time >= s.pendingWave.at`, resolve `s.waterLevel = Math.max(s.waterLevel, s.pendingWave.targetWater)`, `s.lastWaveHitAt = s.pendingWave.at`, `s.waveHitSeq++`, `s.seq++`, `s.pendingWave = null`.
    - On `wakeJesus()`: if `s.pendingWave` is queued, silently settle `s.waterLevel = Math.max(s.waterLevel, s.pendingWave.targetWater); s.pendingWave = null;` (zero stray shake/hit-stop during the Mark 4:38 rebuke card!).
    - On `speakStillness()`: set `s.calmFromIntensity = Math.max(s.stormIntensity, 0.85)`, `s.pendingWave = null`, `s.stormIntensity = 0`, `s.waterLevel = 0`.
  - **Unified Ocean Wave Field & West-to-East Stillness Wavefront:**
    - `seaHeight(x, time, storm, calmFrontX, calmFrom)` drives both rendered wave bands AND boat buoyancy/pitch (`bowY - sternY`) + swinging bronze stern oil lantern pendulum.
    - During `0 <= time - calmedAt < 1.25` (non-reduced), `calmFrontRadius` sweeps `0 → 1400 px` outward from `jesusPos.x = 406`: ahead of the wavefront, water retains `calmFromIntensity`, ironing into glassy stillness **west-to-east (stern to bow)** as the golden-silver stillness ring passes! Under `reduced`, snaps immediately to `0`.
  - **Visual & Audio Craft:** Animated `sailLift` climb (`sailSetAt`), 2-stroke oar foam churn, rogue wave bow spray curtain + `45 ms` visual hit-stop + `4.5 px` camera impact jolt, `65 ms` rebuke hit-stop, warm stern lantern halo over sleeping Jesus, `printDynamic` in `stormBoat.ts:215`, hover rings + drag compass + `140 ms` `ActionBuffer`, live ambient filter sweep (`260 Hz` dusk → `740 Hz` gale → `190 Hz` calm), `cursor: default` in `storm.css`.

### Unit 3: *The Valley of Elah* Gaming & Tactile Sling Pass (`codex/elah-gaming-pass`)
- **Files:**
  - `src/app/scriptures/stories/play/valley-of-elah/elahGame.ts`
  - `src/app/scriptures/stories/play/valley-of-elah/elahScenery.ts`
  - `src/app/scriptures/stories/play/valley-of-elah/elahPeople.ts`
  - `src/app/scriptures/stories/play/valley-of-elah/elahProps.ts`
  - `src/app/scriptures/stories/play/valley-of-elah/elahView.ts`
  - `src/app/scriptures/stories/play/valley-of-elah/elahSound.ts`
  - `src/app/scriptures/stories/play/valley-of-elah/elahController.ts`
  - `src/app/scriptures/stories/play/valley-of-elah/elah.css`
  - `tests/valley-of-elah.test.ts`
- **Gameplay Specification:**
  - Analytic heavy-armor inertia (`accel = [30, 20, 14, 9.5][armorLeft.length]`), hunch lifting per piece, damped `1.8 px` camera settle on heavy coat drop; uniform brook speed (zero determinism discontinuity at brook bank) paired with wet wading splash wakes, deeper water footstep cadence, and `4` rough jagged river pebbles placed outside smooth-stone tap radii (active only in `'brook'`; smooth stones take hit priority; tapping a rough pebble ripples & gently hints without altering `stonesPicked` or an active stone approach).
  - Interactive hold-to-wind sling in `'sling'` phase via `onActionDown`/`onActionUp`/`onActionCancel` and `onHoldStart`/`onHoldEnd`/`onHoldCancel`: builds `slingCharge` (`0 → 1` over `0.85 s`), accelerating overhead whirl, golden-white motion-blur arc, climbing whoosh pitch, tightening brow reticle, and subtle anticipation camera pull; releasing launches. Quick-tap `Space`, clicking `Release stone`, or tapping Goliath/David still releases immediately with zero dexterity barrier.
  - Stone flight tracks camera gently toward Goliath → `55 ms` visual hit-stop → radial brow burst → **Goliath falls forward westward (left, onto his face toward David, 1 Samuel 17:49)** with spinning spear, bouncing dropped shield, billowing dust, Israelite ridge surge + harmonic swell, dynamic wind filter sweep, `printDynamic` in `elahScenery.ts:133`, hover rings + drag compass + `140 ms` `ActionBuffer`, `cursor: default` in `elah.css`.

### Unit 4: *The Overturned Tables* Gaming & Physics Pass (`codex/overturned-tables-gaming-pass`)
- **Files:**
  - `src/app/scriptures/stories/play/overturned-tables/courtGame.ts`
  - `src/app/scriptures/stories/play/overturned-tables/courtCoins.ts`
  - `src/app/scriptures/stories/play/overturned-tables/courtView.ts`
  - `src/app/scriptures/stories/play/overturned-tables/courtSound.ts`
  - `src/app/scriptures/stories/play/overturned-tables/courtController.ts`
  - `src/app/scriptures/stories/play/overturned-tables/temple.css`
  - `tests/overturned-tables.test.ts`
- **Gameplay Specification:**
  - Analytic weighted movement (`accel = 28/s`) with frame-1 reversal snap + `140 ms` `ActionBuffer` eliminating near-miss shove/heal whiffs.
  - `stirCoins` takes active `standingBoxes(s)` (newly flipped stall already has `at !== null`, so excluded!) so scattered silver & bronze coins ricochet physically off neighboring standing stalls instead of clipping through wood (coins remain bounded inside `PAVING_BOUNDS` and outside standing `obstacleBox`es; player/fixture arrival remains `< 1e-6` deterministic at 30/120 Hz). Full-stride shoves impart slightly fuller lunge & coin scatter energy (`1.0×` stationary → `1.18×` full stride).
  - Reactive east-passage carrier pauses warily and turns toward recent stall disturbances before cautiously resuming; floating warm sunlit dust motes drift through clearing light shafts & Bethany evening dusk; live crowd-murmur filter sweep (`setAmbientFilter`) drops as stalls clear; hover rings + drag compass + `cursor: default` in `temple.css`.

## Observable Acceptance Checks

1. `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass cleanly on every unit.
2. Unit tests verify:
   - `storyInk`: `blocks` capped at `512` and `printDynamic` adds `0` entries; `storyMotion`: `integrateVelocity` 30 Hz vs 120 Hz `< 1e-12` & frame-1 reversal, `ActionBuffer` `dt` expiry; `storyStage`: `0` rAF frames queued while idle-paused, wake on `contextrestored`/resume/DPR, hover cursor toggling, `onActionDown`/`Up`/`Cancel` capture handshake; `storyAudio`: pre-unlock `setAmbientFilter`, click-free delayed suspend, limiter fallback.
   - `storm-on-the-lake`: bailing immediately lowers `waterLevel`, rogue wave surges `waterLevel` monotonically `+0.75 s` later across all 6 squall orders, rapid `bail-1 → bail-2` settles surge cleanly, `wakeJesus` settles pending wave silently, `speakStillness` preserves `calmFromIntensity` for west-to-east (stern to bow) wavefront while setting `stormIntensity = 0`, 30 Hz vs 120 Hz `< 1e-6`.
   - `valley-of-elah`: armor inertia & monotonic speeds, rough-pebble non-blocking hint, hold-to-wind charge + quick-tap release equivalence, 1 Samuel 17:49 westward forward fall, 30 Hz vs 120 Hz `< 1e-6`.
   - `overturned-tables`: coin-box ricochet stays outside standing `obstacleBox`es, input buffer lands on arrival, 30 Hz vs 120 Hz `< 1e-6`.
3. Playwright E2E (`tests/e2e/playable-stories-navigation.spec.ts`): 9/9 pass.
4. Rendered desktop (`1280×800`), mobile portrait (`390×844`), and short landscape (`750×360`) screenshots inspected across all three stories + `0` Axe WCAG 2.2 AA violations (light & dark).
5. Full `npm run release:production` (gitleaks, build, full Playwright, 96-route a11y + Lighthouse, Vercel promote) and live HTTP 200 verification.
