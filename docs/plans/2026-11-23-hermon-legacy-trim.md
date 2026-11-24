# Mount Hermon Legacy Layer Trim Plan (`r3`)

- **Date:** 2026-11-23
- **Revision:** `r3` (resolves all 7 `r1` blockers, 4 `r2` surgical blockers, and optional improvements from independent EGM reviews)
- **Source baseline:** `master` @ `c9d57983` (worktree `codex/hermon-legacy-trim`)
- **Target app:** `games/hermon` (static-exported Next.js sub-app mounted at `/play/hermon` and `/play/hermon/crossing`)

## 1. Goal

Remove retired prototype layers still bundled inside `games/hermon/src` after PR #290:

1. The 3 already-unreachable UI components (`MoreControls.tsx`, `ShooterSettings.tsx`, `TrackpadSettings.tsx`).
2. The Gesture Lab (`draw`, `conduct`, `brush` — `src/game/gesture/`, `src/ui/gesture/`, `DrawProbe`, `GestureRibbon`, `HeroTrail`, `gestureCtx`, `labSwitch`, `carve`).
3. The retired desktop trackpad experiment stack (`free`/`Cursor`, `simple`/`One finger + keys`, `flow`, `captured`) and the 8-scheme Controls research lab (`Tried X of 8`, `Number keys 1–8`, `ControlUsage`, `playedControls`, `DemoNote`, `controlsQuery`).
4. The dead `ArmCannon` / `blasterSkin` / `blasterWeights` / `shotDrive` / `ShooterHud` / `autoFire` bracer-blaster code (which still executes `buildBlasterSkin()` for ~30–40 ms on Watchers activation even though `ArmCannon` was removed and `cannonLink.ready` is permanently `false`, and `Shooter.tsx` zeroes `input.fire = false` / `ctx.autoFire = false`), plus legacy `"blaster"` audio naming.

## 2. Preserved Behavior & Non-Goals (Hard Contracts)

- **Desktop standard 3D flight:** `WASD` full `momentumFlight.ts` physics (`22–72 m/s`), hold `Shift` surge, `Space` take off & rise, `F` / standalone `Ctrl` descend & touch down onto ground, `B` brake-flare to hover, `L` glide-land on ledges, `E` read nearby *1 Enoch* tablet, drag-to-look or short-click Pointer Lock (with `exitOwnPointerLock()` / `unlockExpected()` resize safety), arrow keys, `Esc` pause.
- **Opt-in Watchers battle:** Calm dawn sky on launch (`shooter: false`); top-right `Watchers` toggle (`aria-pressed`) enables/disables Watchers mid-flight without pausing or dropping the player; `Click` (locked) / `C` strike, `Right-click` / `V` shield, `1–4` combat commands, `<FlamingSword />`, `<Battle />`, `<Banishment />`, `<CounterCue />`, `<BattleHud />`.
- **Mobile / Touch flight:** Both **One finger** (`touchScheme: 'classic'`, including tap/stroke-a-Watcher via `useClassicThumbs` + `FlightFeel` hold-to-fly button) and **Twin stick** (`touchScheme: 'twin'`, including `TouchCluster`, `TwinStickOverlay`, `lookAccel`, and `edgeRest` preferences in `TouchSettings.tsx`), selectable via a touch-only 2-option Controls switcher (`One finger` / `Twin stick`) in the header, Pause card, and Flight settings.
- **Accessibility:** `TapControls` single-tap pad, `FieldGuide` + 5 *1 Enoch* tablets + `TabletBeacons`, single non-duplicated `aria-live="polite"` battle announcements in `BattleHud.tsx:92`, `prefers-reduced-motion`.
- **Diagnostics:** `Download frame measurements`, `Start/Download local input recording` (`gestureLog.ts`), and touch `Screen diagnostics` remain under `Diagnostics & playtest downloads` in `TestPanel.tsx`.
- **Sibling routes:** `/play/hermon/crossing` and `/play/hermon/crossing/account` remain untouched and working (`suitRig.ts`, `droneMesh.ts`, `crossing/*` stay intact).
- **Non-goals:** Do not rename heavily shared live 3D rig/world modules (`Suit.tsx`, `Drones.tsx`, `DistrictBoundary.tsx`, `suitRig.ts`, `suitSkeleton.ts`, `droneMesh.ts`) and do not bump `games/hermon/package.json` `react`/`next` (`19.2.8`/`16.4.5`).

## 3. Architectural Cuts & File Map

### Cut A — Delete unreachable UI files (3 files)
- Delete `src/ui/MoreControls.tsx`, `src/ui/ShooterSettings.tsx`, `src/ui/TrackpadSettings.tsx`.

### Cut B — Retire Gesture Lab (`draw` / `conduct` / `brush`) while preserving mobile One-finger tap/stroke strike
- **Relocate the 3 live gameplay modules out of `gesture/` with exact existing constants:**
  1. `src/game/gesture/screenRay.ts` -> `src/game/screenRay.ts`: inline `TRACK_FRAMES = 64`, `TRACK_DRONES = 8` (`gesture/tuning.ts:47`) and define `AimFrame` locally. Update `src/ui/CombatTarget.tsx:8`, `src/world/WatcherTrack.tsx`, and `src/game/tapStrike.ts`.
  2. `src/game/gesture/combatStroke.ts` -> `src/game/combatStroke.ts` (update import in `src/ui/useClassicThumbs.tsx`).
  3. Consolidate `src/game/gesture/tapBlast.ts` + `src/game/gesture/tapFire.ts` -> `src/game/tapStrike.ts`: inline `GHOST_MS = 80`, `R_EFF_MIN = 28`, `R_EFF_PAD = 18`, `TRACK_DRONES = 8` (`gesture/tuning.ts:44,46-47`); export `pickAt` using `./screenRay`; update `src/ui/useClassicThumbs.tsx`.
  4. Rename `src/world/GestureTrack.tsx` -> `src/world/WatcherTrack.tsx` (imports `@/game/screenRay`; mounted by `<TapTrack />` in `Scene.tsx` only when `shooter && touchScheme === 'classic'` on touch-capable devices).
  5. In `src/game/thumbGate.ts`, inline `TAP_SLOP_TOUCH = 10`, `TAP_MS = 250` (`gesture/tuning.ts:24`).
- **Delete dead `tapMark.ts`:** Remove `src/ui/gesture/tapMark.ts`, remove `markAt` from `src/ui/useClassicThumbs.tsx:10,74`, and remove `data-touch-blast` / `html[data-touch-blast]` from `src/ui/Experience.tsx:102-107` and `src/ui/Experience.module.css:149`.
- **Delete all Gesture Lab files:**
  - Entire `src/game/gesture/` (31 files) and `src/ui/gesture/` (16 files) directories after relocating the 3 live files above.
  - `src/game/gestureCtx.ts`, `src/game/carve.ts`, `src/ui/labSwitch.ts`, `src/world/DrawProbe.tsx`, `src/world/GestureRibbon.tsx`, `src/world/HeroTrail.tsx`.
  - Obsolete lab-only test: `tests/gesture-lab-stats.test.ts`.
- **Simplify callers:**
  - `src/game/Player.tsx`: remove `gestureBase`/`gestureBefore`/`gestureOffset`/`gestureVelocity`/`clearGesture`/`gesture`/`gestureCtx`. At `Player.tsx:121`, copy `setVec(baseScratch, runtime.velocity.x, runtime.velocity.y, runtime.velocity.z)` before `shoveBase(runtime.velocity, baseScratch)` so in-place mutation in `hurtShove.ts` never aliases `runtime.velocity`. Set `runtime.flown = moving(intent);`.
  - `src/game/runtime.ts`, `src/game/pilotFlight.ts`: remove `gesture`, `clearGesture`, `gestureIntent`, `carve`, `resetCarve`.
  - `src/game/FlightPresentation.tsx`, `src/game/presentation.ts`, `src/world/Suit.tsx`, `src/world/suitPose.ts`: inline `FACING_FAST = { yaw: .6, pitchUp: .7, pitchDown: .9 }` in `presentation.ts` for `fast > .5`; drop `FACING_AIM`, `input.facing`, `input.aimYaw`, `input.aimPitch`, `input.spin`, `pose.spin`, `labFacing`, `aimFacing`; drop `pose.spin` in `Suit.tsx:74` and unused `spin` param in `suitPose.ts`.
  - `src/game/shooterStep.ts`, `src/game/shooterShots.ts`, `src/world/shotBody.ts`, `src/world/suitBlaster.ts`: remove `aimed`, `trackAimed`, `shotDirOf` — use `s.aim.dir` directly.
  - `src/world/Scene.tsx`: remove `<LabLayer />`, lazy lab imports, and `labFault`; mount `<TapTrack />` (lazy `<WatcherTrack />`) inside `<Physics>`.
  - `src/ui/Experience.tsx`, `src/ui/TestPanel.tsx`, `src/ui/PauseCard.tsx`, `src/ui/Experience.module.css`: remove `LabControls`, `LabStatsTable`, `data-controls`, `html[data-controls]`, `.reticle` (lines 58 & 123 forced-colors), and `LAB_LOAD_FAILED`/`LAB_FAILED`.

### Cut C — Retire dead `ArmCannon`, `blasterSkin`, `shotDrive`, `autoFire`, and `ShooterHud`; clean `blaster` audio names
- **Delete:** `src/world/blasterSkin.ts`, `src/world/blasterWeights.ts`, `src/world/shotDrive.ts`, `src/game/autoFire.ts`, `src/ui/ShooterHud.tsx`, `src/ui/ShooterHud.module.css`, `src/ui/hudTimeline.ts`.
- **Replace `src/world/cannonContract.ts` with `src/world/handLink.ts`:**
  - Keep private `FIT = { q, t }` and export only `V3`, `FOREARM`, `BARREL_AXIS`, `MUZZLE`, `fitDir`, `fitPoint`, and `handLink: { forearm: Object3D | null }`.
  - Remove dead `AXIS_ORIGIN`, `RADIAL_Z`, `STATION`, `rimStation`, `HAND`, `HAND_HEAD`, `HAND_SCALE`, `SLIDE_MAX`, `VENT_MAX`, `VENT_DIR`, `NODES`, `BUDGET`, `VIEWS`, `COLORS`, `RGB`, `Socket`, `cannonDrive`, `restCannonDrive`, `ready`, `handHidden`, `ventMouth`, `ventDir`, `fxMuzzle`.
- **Update `src/world/suitBlaster.ts`:**
  - Remove `buildBlasterSkin`, `setBlasterSkin`, `writeCannonDrive`, `b.skin`, `b.hidden`, `HAND`, `HAND_SCALE`; keep `aimPose` + `shotBody` pose and `s.muzzle.valid = false`.
  - Preserve same-frame fault cleanup with **two sequential `if`s** and guard `handLink.forearm` on `!shooterFaulted()`:
    ```ts
    if (f.on && !shooterFaulted()) run(f, dt);
    if (!f.on || shooterFaulted()) release(f);
    handLink.forearm = skinned && f.on && !shooterFaulted() ? f.rig.joints[FOREARM] : null;
    ```
  - `release(f)` resets `b.body`/`b.aim` whenever `(!f.on || shooterFaulted())`.
- **Update `src/world/shotBody.ts`, `src/world/ShotFx.tsx`, `src/world/fxPools.ts`, `src/world/FlamingSword.tsx`, `src/world/Suit.tsx`, `src/world/aimPose.ts`, `src/game/Shooter.tsx`, `src/game/shooterStep.ts`:**
  - Remove `restCannonDrive()` in `shotBody.ts`, remove `autoFire` calls in `Shooter.tsx` and `shooterStep.ts`.
  - Simplify `tracerOrigin(e, out)` in `fxPools.ts` (drop unused `clock` and dead `fx: Socket`) and `stepSteam(q, t, fallback, rng, p, c)` (preserving existing `vent.valid === false` zero-jet dispersion with `j = .06`); drop `cannonContract`/`handLink` import from `ShotFx.tsx` and `fxPools.ts`.
  - Import `./handLink` in `FlamingSword.tsx`, `Suit.tsx`, `aimPose.ts`, `suitBlaster.ts`.
- **Replace twin-stick `ShooterHud` safely:**
  - In `Experience.tsx`, render `.aimDot` when `state.shooter && (state.pointerLocked || (isTouch && twin))`.
  - Keep the single existing `aria-live="polite"` region at `BattleHud.tsx:92`.
- **Clean `"blaster"` audio & fault naming:**
  - Rename `src/ui/blasterVoices.ts` -> `src/ui/combatVoices.ts`.
  - In `src/ui/audioUnlock.ts`: rename `unlockBlasterAudio` -> `unlockHermonAudio`, `blasterContext` -> `hermonAudioContext`, `quietBlasterAudio` -> `quietHermonAudio`, `releaseBlasterAudio` -> `releaseHermonAudio`, updating `audioBus.ts` and all callers.
  - In `src/game/shooterFault.ts:13`: replace `'The blaster stopped. Flight continues.'` with `'The Watchers encounter stopped. Flight continues.'`.

### Cut D — Retire desktop trackpad experiments and 8-scheme Controls research lab
- **Delete retired desktop trackpad experiment files:**
  - `src/ui/FlowHud.tsx`, `src/ui/FlowWelcome.tsx`, `src/ui/Flow.module.css`, `src/ui/SimpleTrackpadHud.tsx`
  - `src/ui/useFlowTrackpad.ts`, `src/ui/useSimpleTrackpad.ts`, `src/ui/useCruiseCapture.ts`
  - `src/ui/trackpadPill.ts`, `src/ui/trackpadWindow.ts`, `src/ui/hoverPress.ts`
  - `src/game/trackpadFlight.ts`, `src/game/flowFlight.ts`
  - In `src/game/thumbFlight.ts`: remove dead `edgeFactor` and `deskEdge`.
- **Replace `src/ui/useTrackpad.ts` with `src/ui/useMouseLook.ts`:**
  - Drag-to-look (`>= 5 px`, honors `lookSensitivity`/`invertY`) + short-click Pointer Lock (releases pointer capture before `requestPointerLock` for WebKit/Safari compatibility, silent fallback).
  - Update `src/ui/TouchControls.tsx` to use `useMouseLook(surface)` and remove `trackpadFlying` / `data-trackpad-active`.
- **Replace all 21 files in `src/ui/controls/` (including `ControlsPicker.module.css`) + `LazyControls.tsx` + `SheetLost.tsx` + `controlTypes.ts` + `tests/played-controls.test.ts` with a 3-file touch-only switcher:**
  - `src/ui/controls/TouchControlsPicker.tsx`: exports `TouchControlsTrigger` (header pill when touch-capable) and `TouchControlsRow` (for `PauseCard` and `TestPanel`), consistently gated via existing `useTouchCapable()` (`src/ui/useTouchCapable.ts`).
  - `src/ui/controls/TouchControlsSheet.tsx`: non-modal bottom sheet / popover (`data-scroll-ok=""` on body for `usePlayGuard.ts`) with **One finger** (`classic`) and **Twin stick** (`twin`) radio inputs, `Flight settings` link (calls `pause()` if playing, then sets `{ controlsOpen: false, panel: true }`), `Escape` + backdrop dismissal, and `Done` button. Switching `touchScheme` calls `clearInput()`, `if (document.pointerLockElement) exitOwnPointerLock()`, updates `{ touchScheme, inputEpoch: state.inputEpoch + 1, message }`, and calls `persistGame()`.
  - `src/ui/controls/TouchControlsPicker.module.css`: unified obsidian-wine/gold styling.
  - **Lifecycle & modal-limbo invariants:**
    - Both `pause()` and `resume()` in `src/ui/useInput.ts` explicitly set `controlsOpen: false` (covering Pause button taps, iOS back-swipe `leavePrompt`, pinch-zoom pause, tab hide, and WebGL loss).
    - `Escape` in `src/ui/useInput.ts:44` is guarded with `!state.controlsOpen` so pressing `Escape` closes the open sheet rather than pausing flight underneath it.
    - `Experience.tsx` mounts `<TouchControlsSheet />` whenever `bar && (touchCapable || state.controlsOpen)` so opening from `TestPanel`/`PauseCard` on any hybrid device never strands the user paused.
- **Clean state, runtime, input, audio, hints, and tests:**
  - `src/game/store.ts` (`CONTROLS_VERSION = 8`):
    - Keep live Twin-stick prefs `lookAccel` and `edgeRest` in `GameState`, `PERSISTED_KEYS`, and `hydrateGame()` (`before5` fallback).
    - Remove `desktopMode`, `trackpadFlying`, `trackpadSteering`, `sustainedEdges`, `reverseScroll`, `cruiseSpeed`, `flowIntroSeen`, `controlLab`, `autoFire`, `'simple'` `HintSeries`, `ControlFields`, `overrideControlFields`, `saveControlFields`; keep `pinFields` and `overrideShooter`.
    - `hydrateGame()` ignores unknown legacy keys in `localStorage`, migrates pre-v7 `shooter` to `false` and pre-v6 `touchScheme` to `'classic'`.
  - `src/game/runtime.ts`: remove `runtime.trackpad`, `startTrackpad`, `stopTrackpad`, `brakeFlow`, `setFlowThrottle`, `startFlow`, `runtime.flowPractice`, and `./flowFlight` import; keep module-level `let unlockUntil = -Infinity` with `exitOwnPointerLock()` and `unlockExpected()`.
  - `src/game/edgeTurn.ts`: remove `./trackpadFlight` import, `rt.trackpad`/`lv.source`/`lv.turn`/`lv.pitch`, and `sustainedEdges` from `EdgePrefs`; keep `applyEdgeTurns` for Twin-stick `rt.stick.edgeTurn` and `thumbTurn` for One-finger `rt.thumb`.
  - `src/game/commandKeys.ts`: digits `1–4` map unconditionally to combat commands when active.
  - `src/game/gestureLog.ts`: keep local input recording & export spreading `Sample` fields (`deltaX`, `deltaY`, etc.) onto rows while reading live `runtime.speed`/`state.flying`/`state.shooter`/`state.touchScheme`.
  - `src/ui/useInput.ts`: remove `desktopMode`/`controlLab`, `toggleSurge()`, `swallowed`/`flightKey`, and Space-to-land fallback; set `controlsOpen: false` in `pause()`/`resume()`; guard `Escape` with `!state.controlsOpen`.
  - `src/ui/shooterKeys.ts` & `src/ui/useShooterInput.ts`: narrow `ShooterEnv` to `{ enabled, started, paused, aimToggle, locked }`; remove `simplePrimaryPress`, `KeyQ` non-mouse branch, and `runtime.trackpad.capture`; simplify `lockedClickFire(env) => live(env) && env.locked`, `swallowsPress(e, env) => e.button === 0 && lockedClickFire(env)`, `mouseDown` (button 2 -> `SHIELD.mouse`), and `lookSourceFor(pointerType, capable = true)` (`'touch' | 'mouse'`).
  - `src/ui/useAudio.ts`: remove `flow` selector and flow branches.
  - `src/ui/ControlsHint.tsx`, `src/ui/hintSteps.ts`, `src/game/limitCopy.ts`: narrow `HintEnv`/`HintSeries` to `'touch' | 'mouse'`, removing `'simple'`, `'line'`, `desktopMode`, `steering`, `autoFire`; simplify `inputKind(touch)`.
  - `src/game/Player.tsx`, `src/game/CameraRig.tsx`, `src/game/pilotFlight.ts`, `src/game/touchFlight.ts`: remove dead `runtime.trackpad`, `desktopMode`, `trackpadSteering`, `controlLab`.
  - **Tests & fixtures:**
    - `tests/desktop-flight.test.ts`: update to v8 `store`/`runtime`/`shooterKeys` (`ShooterEnv`, `keyDown`, `mouseDown`, `mouseUp`) and assert legacy v1–v7 `localStorage` keys hydrate cleanly while keeping `lookAccel`, `edgeRest`, and `discoveredTablets`.
    - `tests/flight-weight.test.ts:204`: expect `runtime.flown = moving(intent);`.
    - `tests/pilot-flight.test.ts`: retire the single free-cursor test (lines 17–24) and remove dead `runtime.trackpad.active = false` (line 27) and `runtime.trackpad.held = false` (line 37) from the 3 surviving tests.
    - `tests/lim/harness.ts`, `tests/limit-invariants.test.ts`, `tests/fixtures/limit-baseline.json`: remove `kind: 'cursor'` and `carve` from `harness.ts`, remove `SCRIPTS[2]` from `limit-invariants.test.ts`, and drop **only** `openAir[2]` from `limit-baseline.json`.
    - `tests/gesture-recording.test.ts`: verify local input recording & export pass unchanged.

## 4. Verification & Acceptance Checks

1. `games/hermon`: `npm run typecheck`, `npm run test`, `npm run build`, plus static reachability script confirming **0 unreachable `.ts`/`.tsx`/`.css` files** under `games/hermon/src`.
2. Host repo (Node `v24.20.0`): `npm run prepare:hermon`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, Playwright E2E (`tests/e2e/hermon-stories.spec.ts`, `tests/e2e/playable-stories-navigation.spec.ts`), and Desktop Chrome (`1440×900`) + iPhone 13 WebKit (`390×844`) visual/interactive checks.
3. Ship via `agent-task finish`, PR + merge into `master`, and `npm run release:production`.
