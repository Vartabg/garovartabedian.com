# Mount Hermon: Unified Desktop Flight & Calm Exploration Plan

- **Plan revision:** r2 (2026-11-23, addressing EGM r1 findings MB-1 through MB-6 and optional improvements 1–6)
- **Source baseline:** `54f8c89d` (`master`), linked worktree `codex/hermon-desktop-flight`
- **Target surface:** `/play/hermon` (and shared assets/tests under `games/hermon/`; `/play/hermon/crossing` and `/play/hermon/crossing/account` remain intact)

## 1. Goal & User Direction

Fix the desktop free-flight experience on `https://garovartabedian.com/play/hermon` so it feels like one coherent, joyful 3D winged flight experience rather than five stitched prototypes.

- **Accepted:** Mount Hermon dawn world (840m × 730m alpine relief, Cloven Arch, Lower Gorge, Sanctuary of the Throne, 5 discoverable 1 Enoch stone tablets), animated winged Archangel with `momentumFlight.ts` energy physics (22 m/s cruise, 34 m/s surge, diving to 72 m/s, pulling up into climbs, wing-flare hover), and *The Cloven Arch* at `/play/hermon/crossing`.
- **Rejected:** Multi-codebase HUD mashup (4 palettes/fonts at once), stale "blaster"/"suit" copy, exposed 8-scheme desktop Controls research lab ("Tried 0 of 8", number keys `1–8` hijacking combat and triggering Flow modal), 8 m/s toggle-cruise hijacking `W`/`Space`, FPS crosshair for a disabled blaster, and immediate combat/prompt bombardment on spawn.
- **Chosen direction (Garo, 2026-11-23):**
  1. **Flight-first exploration + opt-in Watchers battle:** `/play/hermon` opens into a calm dawn sky to fly, dive, bank, land, and discover the 5 *1 Enoch* tablets; the Watchers' battle is an explicit player toggle (`Watchers` / `Calm sky`), not an ambush on spawn.
  2. **Standard 3D desktop flight (`WASD` + mouse look):** Hold `W/A/S/D` for full momentum flight (22–72 m/s), hold `Shift` to surge, `Space` to take off and hold to rise, `F` (primary; standalone `Ctrl` also supported) to descend and touch down onto flat ground, `B` to brake-flare into hover, `L` to land on a targeted ledge, `E` to read a nearby tablet, and click the open canvas for mouse look — OR click-and-drag to look without locking (plus arrow keys).

## 2. Consequential Design Decisions & Contracts

### 2.1 State, Discovery & Storage Migration (`games/hermon/src/game/store.ts`, `games/hermon/src/game/navigation.ts`)
- Bump `CONTROLS_VERSION` from `6` to `7`.
- Persisted defaults (`PERSISTED_KEYS`, preserving `hermon.flight.v1`):
  - `shooter: false` (calm exploration by default; `?shooter=1` URL override starts with battle active; `?shooter=0` keeps calm).
  - `desktopMode: 'mouse'` (unified standard 3D desktop flight; legacy `?trackpad=...` and `?controls=...` query overrides remain supported without changing default visits).
  - `controlLab: 'standard'`.
  - Add `discoveredTablets: string[]` to `PERSISTED_KEYS` (and keep `discovered: boolean` derived as `discoveredTablets.length > 0`). In `hydrateGame()`, filter and deduplicate `saved.discoveredTablets` against the 5 known `TERMINALS` IDs (`hermon-oath-01`, `north-core-12`, `west-flats-09`, `east-flats-14`, `south-breach-03`); when `saved.discoveredTablets` is absent or invalid and `saved.discovered === true`, hydrate to `['hermon-oath-01']`.
- For pre-v7 saved `localStorage` (`version < 7`): migrate `desktopMode` to `'mouse'`, `shooter` to `false`, and `controlLab` to `'standard'` so returning desktop visitors immediately get the repaired experience; v7+ saves preserve user choices.
- Runtime-only store fields (NOT in `PERSISTED_KEYS`):
  - `nearTerminalId: string | null` (null when away from tablets)
  - `nearTerminalLabel: string` (`''` when away, else `terminal.location`, e.g. `'Tablet of Semjaza'`)
  - `journalTerminalId: string | null` (the tablet to spotlight when `FieldGuide` opens via `E` or `HintSlot`)
  - `pointerLocked: boolean` (updated on `pointerlockchange`, used for the subtle 6px center dot when locked in Watchers battle)
- Populate `nearTerminal`, `nearTerminalId`, and `nearTerminalLabel` in `Player.tsx` (`nearestTerminal(runtime.position)`) so `hintQueue.ts` stays lightweight and free of `navigation.ts`.
- Provide one shared helper `openTabletRecord(terminalId?: string | null)` (in a tiny UI helper module or `store.ts` action + `pause()` in UI) called by BOTH `KeyE` (`useInput.ts`) and `HintSlot.tsx`'s read button: appends `terminalId` (when valid and not present) to `discoveredTablets`, sets `discovered: true`, `journal: true`, `journalTerminalId`, persists, and pauses.
- Slightly widen `TERMINALS` detection radii in `navigation.ts` (`7m` at Threshold of Hermon, `12m` at the four outer sanctuaries) and export `TERMINAL_IDS` + `terminalById(id)` for store sanitization and `FieldGuide`.

### 2.2 Unified Desktop Flight, Landing & Input Contract (`useInput.ts`, `useTrackpad.ts`, `Player.tsx`, `touchFlight.ts`, `runtime.ts`, `useShooterInput.ts`, `shooterKeys.ts`, `commands.ts`, `commandKeys.ts`)
- **Separate `runtime.lift` and `runtime.land` (`runtime.ts`, `Player.tsx`, `useInput.ts`, `Experience.tsx`):**
  - `runtime.lift`: takeoff-only signal (`!flying -> flying = true`).
  - `runtime.land`: explicit land/cancel-landing toggle (`flying -> cancel landGoal if active, else start landGoal on landTarget, else set message 'Aim at flat ground nearby to land.'`).
  - `Experience.tsx`'s touch/tap `Lift`/`Land` button writes `state.flying ? (runtime.land = true) : (runtime.lift = true)`.
  - On desktop `Space` (`useInput.ts`, excluded whenever `(e.target as HTMLElement).closest('button,a,input,select,textarea,dialog,[role="dialog"]')` so `Tab + Space` button activation is preserved):
    - When `!state.flying` and `!e.repeat`: sets `runtime.lift = true` AND adds `'Space'` to `runtime.keys`.
    - When `state.flying`: adds `'Space'` to `runtime.keys` (`vertical = +1` in `readIntent()` alongside `KeyR`). Never triggers landing or toggle-cruise.
- **Full momentum flight & hold-to-surge (`useInput.ts`, `runtime.ts`):**
  - `W/S/A/D` feed `readIntent()` directly into `momentumVelocity()` (`FLIGHT.cruise = 22`, `FLIGHT.boost = 34`, dive up to `FLIGHT.maxGlide = 72`, release flares wings to hover).
  - `ShiftLeft` / `ShiftRight`: **hold-to-surge**. Track `shiftHeld` (or `'ShiftLeft'`/`'ShiftRight'` in `runtime.keys` / `runtime.shiftHeld`): `keydown` sets `runtime.surge = true`, `keyup` clears `runtime.surge = false` (only if the other Shift key is not held). In `useInput.ts` `keyup`, do **not** clear `runtime.surge` when `WASD`/`RF` release while Shift is still held. Clear `runtime.surge` on `blur` / `pause` / `clearInput`.
- **Desktop descend & gentle touchdown (`useInput.ts`, `runtime.ts`, `touchFlight.ts`, `Player.tsx`):**
  - `KeyF` is the primary descend key (works cleanly alongside `W/A/S/D` on macOS/Windows/Linux without hitting OS/browser chords like `Ctrl+W`).
  - Standalone `ControlLeft` / `ControlRight` is also supported for descend (handled before the `e.ctrlKey` modifier skip when `!e.metaKey && !e.altKey`, added to `runtime.keys`, removed on `keyup`/blur).
  - In `runtime.ts`, track `keyDescendUsed: boolean` (reset in `clearInput` and `releaseHeldInput`) and make `readIntent()` drop keyboard descend's `-1` while `runtime.keyDescendUsed` is true (mirroring `runtime.stick.descendUsed`).
  - Add `desktopLandStep(ctx)` in `touchFlight.ts` (leaving `touchLandStep` and `touchBlockedStep` untouched so `tests/touch-flight.test.ts` stays green): runs right after `touchBlockedStep` in `Player.tsx` (BEFORE `readIntent()` and `limitStep`), checks desktop descend held (`KeyF`/`ControlLeft`/`ControlRight`), probes below within `FOOT + LAND_WINDOW` (`probeBelow`), and when a flat landable surface is found sets `runtime.landGoal`, sets `runtime.keyDescendUsed = true`, and `useGame.setState({ landing: true })`. Because `readIntent()` drops descend's `-1` once `keyDescendUsed` is true, `Player.tsx:92` does NOT cancel `landGoal`, while pressing `WASD` or `Space`/`R` immediately cancels landing! Also support `L` key (`KeyL` -> `runtime.land = true`) to glide-land on a targeted ledge (`runtime.landTarget`) or cancel landing.
- **Explicit brake (`B`):**
  - Move the `KeyB` listener into `useInput.ts` (removing it from `FlightFeel.tsx` so there is never a duplicate listener and `B` is always live on desktop). Pressing `B` calls `clearInput(false, true); flightFeel.brake = true; flightFeel.serial++;` (`keepShooter = true` so braking never drops an active shield).
- **Camera look (`runtime.ts`, `useInput.ts`, `useTrackpad.ts`):**
  - `look(dx, dy, sensitivity = 1, invertY = false)` applies both `sensitivity` and `invertY` (`invertY ? +dy : -dy`). Both `useInput.ts` (locked `mousemove`) and `useTrackpad.ts` (unlocked drag-look) pass `state.lookSensitivity` and `state.invertY`.
  - In `desktopMode === 'mouse'` (`useTrackpad.ts`):
    - `pointerdown` (button 0, unlocked): record `{ id, x, y, dragged: false }` and capture pointer.
    - `pointermove` (unlocked): once movement `>= 5px`, set `dragged = true` and call `look(dx, dy, state.lookSensitivity, state.invertY)`.
    - `pointerup` (unlocked): release pointer capture **first** (avoiding WebKit/Safari pointer-capture + user-activation rejection). If `!dragged` and `!paused`: call `canvas.requestPointerLock()` silently (if unavailable or rejected, swallow error and remain cleanly in drag-to-look + arrow-key mode — no modal or error toast).
    - `pointercancel` / `lostpointercapture`: clear `press.current = null` so drag-look never sticks.
    - `wheel`: in `desktopMode === 'mouse'`, no-op (does not mutate hidden trackpad throttle).
  - Escape exits Pointer Lock and opens `PauseCard` (`"Take your time."`).
- **Opt-in Watchers Battle desktop controls (`commands.ts`, `commandKeys.ts`, `useShooterInput.ts`, `shooterKeys.ts`, `Battle.tsx`):**
  - Add `mouse: 8` to `SHIELD` in `commands.ts` (`{ keys: 1, touch: 2, button: 4, mouse: 8 }`).
  - In `desktopMode === 'mouse'` when `state.shooter === true`:
    - While Pointer Locked: `mousedown(0)` -> sword strike (`pressFire(s, 'click')`); `mousedown(2)` -> `s.input.shield |= SHIELD.mouse`, `mouseup(2)` -> `s.input.shield &= ~SHIELD.mouse` (retiring ADS zoom on right-click and retiring `KeyQ` ADS zoom on desktop in `shooterKeys.ts` so nothing triggers slow-hover `aimVelocity` or unexpected FOV zoom).
    - Clear `SHIELD.mouse` on `!document.pointerLockElement`, `blur`, pause, toggling `shooter` off, and unmount. Clear `SHIELD.keys` in `releaseKeys()` (`runtime.ts`), `blur`, pause, and unmount.
    - Always (locked or unlocked): `C` strikes/chains, `V` holds shield (`SHIELD.keys`), `1` rebukes (Jude 9), `2` strikes, `3` binds, `4` casts. In `commandKeys.ts`, bypass `keysEnabled()` when `controlLab === 'standard'` on desktop so `1–4` always work in battle.
  - Note on `Battle.tsx` (verified in source): `Battle.tsx:24` already passes `!s.paused && s.flying` as `active` to `stepBattle()` (so Watchers hold fire while grounded on the summit terrace) and `Battle.tsx:21` already calls `resetBattle(runtime.shooter.stats.kills)` on mount.

### 2.3 Safe Mid-Flight Watchers Toggle & World Beacons (`Scene.tsx`, `TabletBeacons.tsx`, `Experience.tsx`)
- **Isolated `<Suspense>` for `<ShooterLayer />` (`Scene.tsx`):**
  - Wrap `<ShooterLayer />` in its own `<Suspense fallback={null}>` inside `<Physics>` so toggling `Watchers` on mid-flight fetches `watcher.glb` WITHOUT suspending `<Physics>`, `<NearMassif>`, `<Player>`, or `<Suit>`.
  - When toggling `Watchers` off (`shooter: false`), clear `runtime.shooter.input.shield = 0`, call `resetShooterFeel(runtime.shooter)`, and cancel any in-flight strike (`cancelStrike()`). When toggling on (`shooter: true`), clear any prior shooter fault, remount `<ShooterAssets />` (which runs `resetBattle` + `resetBanish`), unlock audio if unmuted, and set a brief status message (`"The Watchers gather in the gorge."`).
  - Give the header `Watchers` toggle button `onMouseDown={e => { if (!touchMode()) e.preventDefault(); }}` and blur on click so subsequent `Space` presses take off/rise instead of re-toggling the button.
- **Five 1 Enoch Tablet Beacons (`TabletBeacons.tsx`, mounted in `Scene.tsx`):**
  - 2 instanced meshes (`5` instances each: translucent vertical light beam + floating diamond crown) above the 5 `TERMINALS` pillars (`navigation.ts`), using white base material color so `setColorAt` tints cleanly (`#f2b84b` gold for unfound, `#9e8eb8` dim lavender for discovered), `fog: false`, `depthWrite: false`, `toneMapped: false`, `frustumCulled: false`, disposed cleanly on unmount.
  - Respects `frameloop="demand"` (`CURRENT_GUIDANCE.md`): animates subtle diamond hover only while `!paused && !state.reduced` (no extra `invalidate()` while paused or reduced motion).

### 2.4 Unified Visual System & Quiet HUD (`Experience.tsx`, `Experience.module.css`, `Telemetry.tsx`, `BattleHud.tsx`, `BattleHud.module.css`, `FlightFeel.tsx`, `FlightFeel.module.css`, `HintSlot.tsx`, `hintQueue.ts`, `ControlsHint.tsx`, `ControlsEntry.tsx`, `ControlUsage.tsx`, `controlKeys.ts`, `Landing.tsx`, `PauseCard.tsx`, `TestPanel.tsx`, `FieldGuide.tsx`, `Modal.tsx`)
- **One design language everywhere (`globals.css` tokens):** obsidian-wine (`#14111d`), parchment (`#f5efe2`), muted (`#c2b8cc`), molten gold (`#f2b84b`), `--font-sans` (Geist), radii `--r-sm`/`--r-md`/`--r-lg`.
- **Top-left (`Telemetry.tsx`):** One obsidian-wine pill showing:
  - Line 1: current landmark (`runtime.location.toUpperCase()`, e.g. `THRESHOLD OF HERMON`, `CLOVEN ARCH`, `SANCTUARY OF THE THRONE`).
  - Line 2: `020 m · 24 m/s · SOARING` (altitude, rounded live speed, flight status `GROUND` / `HOVER` / `FLYING` / `DIVING` / `CLIMBING` / `BRAKING` / `ALIGHTING`), keeping all existing `data-*` attributes and `data-testid="flight-telemetry"`.
- **Top-right (`Experience.tsx` header):**
  - On desktop (`!touchMode()` and `controlLab === 'standard'`): render ONLY **`Watchers`** toggle pill (`aria-pressed={state.shooter}`) and **`Pause`** button. Do NOT mount desktop `Controls` 8-mode trigger/sheet, `ControlUsage`, or `controlKeys.ts` (1–8 scheme switching) on desktop when `controlLab === 'standard'`! On touch (`touchMode()`), keep the `Controls` trigger so touch players can still pick One-finger vs Twin-stick.
- **Top-center (`HintSlot.tsx`, `hintQueue.ts`, `ControlsHint.tsx`):**
  - One non-overlapping contextual line: transient `message` (4s), tablet prompt (`◇ ${nearTerminalLabel} · Press E` on desktop / `◇ ${nearTerminalLabel} · Read ↗` on touch), landing prompt (`SURFACE IN REACH · LAND` — preserving the constant string + adding `L` hint in keybar, OR `"Flat ground in reach · Press L to land"` since no Playwright test in this repo asserts `SURFACE IN REACH`; verified via grep), boundary cue.
  - Disable legacy desktop `ControlsHint` coach lines when `desktopMode === 'mouse'` (keep touch coach lines on touch so mobile remains guided).
- **Center screen (`Experience.tsx`):**
  - Remove `: <Reticle />` when `!state.shooter`!
  - On desktop when `state.shooter === true`, do NOT mount `ShooterHud` (retired FPS blaster heat ring); render ONLY a subtle 6px center dot when `state.pointerLocked` (plus `BattleHud`'s gold `CombatTarget` lock ring on the targeted Watcher). On touch twin-stick (`touchMode() && twin && state.shooter`), keep `ShooterHud` if needed or the clean reticle.
- **Bottom-left (`BattleHud.tsx`, `BattleHud.module.css`):**
  - Only mounted when `state.shooter === true`. Restyle completely to obsidian-wine (`#14111de8`), `1px solid #f2b84b4d`, `border-radius: var(--r-md)`, `--font-sans` (Geist).
  - Remove `.legend` (redundant top-center combat text that overlapped `HintSlot` on iPhone!) and remove `.next` (mid-screen tutorial box over the angel's head!).
  - Keep compact `0 / 8 cast down` + `WARD` diamonds + chain badge, incoming dart warning, counter prompt, Jude 9 rebuke line, hurt vignette, and victory/fallen modal.
- **Bottom-center (`Experience.tsx`):**
  - Single quiet desktop keybar (`@media (pointer: fine)`), truthful to the active state and dimming subtly while flying:
    - Ground: `SPACE TAKE OFF · WASD MOVE · DRAG OR CLICK TO LOOK · E READ TABLET`
    - Flying (calm): `WASD FLY · SHIFT SURGE · SPACE / F RISE / DESCEND · B HOVER · L LAND · ESC PAUSE`
    - Flying (Watchers): `CLICK OR C STRIKE · RIGHT-CLICK OR V SHIELD · 1 REBUKE · WASD FLY · ESC PAUSE`
- **Bottom-right (`Experience.tsx`, `FlightFeel.tsx`, `FlightFeel.module.css`):**
  - Hide circular `↑ Lift / ↓ Land` thumb button on desktop unless `state.tapControls` is enabled (keep it on touch).
  - Render `FlightFeel.tsx` ONLY on touch classic (`if (!phone || paused) return null;`), removing its desktop HUD panel and its duplicate `KeyB` listener, and restyling `FlightFeel.module.css` to obsidian-wine + gold tokens.
- **Landing, Pause, Settings, Field Guide & Modal (`Landing.tsx`, `PauseCard.tsx`, `TestPanel.tsx`, `FieldGuide.tsx`, `Modal.tsx`):**
  - `Landing.tsx`: remove `DemoNote` (`"Choose your way to fly in the Controls menu."`). Keep `"Play The Cloven Arch"`, `"Ascend Mount Hermon"`, `"Field guide"`, and `"Playable stories"`.
  - `PauseCard.tsx`: show `Resume flight`, `Challenge Watchers` / `Return to calm sky`, `Field guide` (with `N / 5 tablets` badge), `Flight settings`, `Play The Cloven Arch`, and `Playable stories`. Hide `LazyControls` (`Controls` + `"Tried 0 of 8"`) on desktop when `controlLab === 'standard'` (keep on touch).
  - `TestPanel.tsx`: replace stale `"blaster"` / `"suit"` / `"Trackpad controls"` copy with clean `Perspective`, `Look sensitivity` slider, `Invert vertical look`, `Watchers encounter` toggle, `Graphics`, `Expressive flight poses`, `Reduced camera motion`, `Wind and battle audio`, `Show single-tap movement controls`, `Return to summit altar`, and keep `Playtest measurements` + `Local gesture recording` collapsed under one `<details>Diagnostics & playtest downloads</details>` at the bottom.
  - `FieldGuide.tsx`: concise, honest guide matching actual controls (`How to fly`, `The Watchers' host`, `The five stone tablets` listing all 5 tablets with discovered/undiscovered state and readable 1 Enoch passages, `Your route` with `district-map.svg` & Cloven Arch links, `Play on a phone` QR).
  - `Player.tsx:66`: replace `"Suit restored to a clear landing."` with `"Returned to a clear landing."`.
  - `Modal.tsx` + `Experience.module.css`: use `useId()` for `aria-labelledby`, add `overscroll-behavior: contain` on `dialog:modal` and `overflow: hidden; overscroll-behavior: contain` on `dialog::backdrop`, and add progressive `closedby="any"` + pointerdown/pointerup outside-click light-dismiss fallback (when `!('closedBy' in HTMLDialogElement.prototype)`).

## 3. Affected Files

- `docs/plans/playable-stories-design.md`
- `docs/plans/2026-11-23-hermon-desktop-flight.md`
- `docs/plans/2026-11-23-hermon-desktop-flight-review.md`
- `games/hermon/src/game/store.ts`
- `games/hermon/src/game/commands.ts`
- `games/hermon/src/game/commandKeys.ts`
- `games/hermon/src/game/runtime.ts`
- `games/hermon/src/game/navigation.ts`
- `games/hermon/src/game/touchFlight.ts`
- `games/hermon/src/game/Player.tsx`
- `games/hermon/src/world/TabletBeacons.tsx` (new)
- `games/hermon/src/world/Scene.tsx`
- `games/hermon/src/ui/useInput.ts`
- `games/hermon/src/ui/useTrackpad.ts`
- `games/hermon/src/ui/useShooterInput.ts`
- `games/hermon/src/ui/shooterKeys.ts`
- `games/hermon/src/ui/Experience.tsx`
- `games/hermon/src/ui/Experience.module.css`
- `games/hermon/src/ui/Landing.tsx`
- `games/hermon/src/ui/Telemetry.tsx`
- `games/hermon/src/ui/HintSlot.tsx`
- `games/hermon/src/ui/hintQueue.ts`
- `games/hermon/src/ui/ControlsHint.tsx`
- `games/hermon/src/ui/controls/ControlsEntry.tsx`
- `games/hermon/src/ui/controls/ControlUsage.tsx`
- `games/hermon/src/ui/controls/controlKeys.ts`
- `games/hermon/src/ui/BattleHud.tsx`
- `games/hermon/src/ui/BattleHud.module.css`
- `games/hermon/src/ui/FlightFeel.tsx`
- `games/hermon/src/ui/FlightFeel.module.css`
- `games/hermon/src/ui/PauseCard.tsx`
- `games/hermon/src/ui/TestPanel.tsx`
- `games/hermon/src/ui/FieldGuide.tsx`
- `games/hermon/src/ui/Modal.tsx`
- `games/hermon/tests/desktop-flight.test.ts` (new)
- `tests/e2e/hermon-stories.spec.ts`

(Note: `Battle.tsx` already gates dart attacks on `!s.paused && s.flying` and resets battle on mount, so no edit is required there unless verified otherwise during testing; `tests/persistence.test.ts` does not exist in `games/hermon/tests/` and `desktop-flight.test.ts` will cover v7 hydration/persistence.)

## 4. Failure Behavior & Safety

- **Pointer Lock unavailable/rejected (Safari restrictions, iframes, headless browsers):** Release pointer capture before requesting lock; on error/rejection stay silently in drag-to-look + arrow-key mode with zero blocking modal/toast; `WASD`/`Space`/`F`/`Shift`/`B`/`L`/`E` and `C`/`V`/`1` continue working cleanly.
- **Mid-flight Watchers toggle:** `<ShooterLayer />` is inside its own `<Suspense fallback={null}>` inside `<Physics>`, so loading `watcher.glb` never suspends physics or terrain. Toggling off clears active strike and shield bits.
- **Storage blocked (Safari private browsing / quota error):** `hydrateGame()` / `persistGame()` remain wrapped in `try/catch`; in-session flight, tablet discovery, and Watchers toggle work in memory.
- **WebGL / asset failure:** `Boundary` + `GraphicsRecovery` + `Reload scene` unchanged; `TabletBeacons` disposes geometries/materials/meshes on unmount.
- **No external network calls / CSP compliance:** Zero new external URLs or workers; stays 100% under `/play/hermon` and host CSP.
- **Touch & Crossing non-regression:** `/play/hermon/crossing`, `/play/hermon/crossing/account`, and touch play remain working and verified.

## 5. Observable Acceptance Checks

1. **Calm flight-first desktop launch:** Opening `/play/hermon` (no `?shooter=0` needed) and clicking `Ascend Mount Hermon` enters Mount Hermon with `shooter=false`, zero combat HUD, zero FPS crosshair/reticle, zero `Controls` 8-mode lab button, zero `"Tried 0 of 8"`, and zero bottom-right `Lift` thumb button on desktop.
2. **Full desktop momentum flight & landing:** Pressing/holding `Space` takes off (`data-flying="true"`) and climbs without triggering landing; holding `W` accelerates smoothly to ~22 m/s (`Shift` held surges toward 34 m/s and stays active even if `WASD` momentarily releases; pitching down dives past 25 m/s); releasing `W` flares smoothly into hover; pressing `B` brakes cleanly without dropping shield; holding `F` descends and touches down smoothly onto flat terrain via `desktopLandStep`; pressing `L` glide-lands on a targeted ledge; dragging on canvas turns yaw/pitch without pointer lock; short-clicking canvas locks pointer when permitted.
3. **Tablet discovery:** All 5 *1 Enoch* tablets render golden beacons visible across the gorge/ridges; pressing `E` (or clicking the `HintSlot` button) near the Tablet of Semjaza opens `FieldGuide` directly to *1 Enoch 6:6* and records `hermon-oath-01` (`1 / 5`).
4. **Opt-in Watchers battle:** Clicking `Watchers` in the top bar (without stealing Space focus or suspending physics) spawns the Watchers' host with a unified obsidian-wine battle card (`0 / 8 cast down`, `WARD`), `CombatTarget` ring, `C`/locked-left-click strike, `V`/locked-right-click shield, and `1` rebuke; clicking again returns cleanly to calm sky.
5. **Visual & responsive check:** Desktop (`1440×900`, `1024×768`) and iPhone (`390×844` WebKit) screenshots show one consistent obsidian-wine/parchment/gold visual language and zero overlapping HUD elements.
6. **Automated gates:** `games/hermon`: `npm run typecheck && npm test && npm run build`; host repo: `npm run lint && npm run typecheck && npm run test && npm run build && npm run test:e2e && npm run test:a11y`.
