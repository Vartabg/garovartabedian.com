# Independent EGM Design Review Report — Mount Hermon Legacy Layer Trim

- **Plan:** `docs/plans/2026-11-23-hermon-legacy-trim.md`
- **Source baseline:** `master` @ `c9d57983` (worktree `codex/hermon-legacy-trim`)
- **Date:** 2026-11-23

## Review Rounds & Completion Evidence

| Round | Revision | Reviewer (fresh-context read-only `research` subagent) | Verdict | Findings |
| --- | --- | --- | --- | --- |
| 1 | `r1` | `b1528c68-58db-4ebf-aa4a-6a3ee8d7e5d0` | `BLOCKED` | 7 Material Blockers, 3 Optional Improvements |
| 2 | `r2` | `1c6103d0-7894-42c1-a1cc-eedbc3a67ad4` | `BLOCKED` | 4 Material Blockers, 5 Optional Improvements (all 7 `r1` blockers verified resolved; 0 orphaned files verified) |

## Reading List Supplied to Reviewers

- `AGENTS.md`
- `docs/plans/2026-11-23-hermon-legacy-trim.md` (`r1` for Round 1, `r2` for Round 2)
- `games/hermon/src/**` and `games/hermon/tests/**` (all files referenced by the plan plus full import-graph reachability check)
- Host `tests/e2e/hermon-stories.spec.ts` and `tests/e2e/playable-stories-navigation.spec.ts`

## Dispositions

### Round 1 (`r1`) — All 7 Material Blockers + 3 Optional Improvements Accepted & Resolved in `r2`
1. **MB-1 (Live Twin-stick `lookAccel`/`edgeRest` & `edgeTurn.ts`):** Accepted. Retained `lookAccel`, `edgeRest`, and `before5` migration in `store.ts`; scoped `edgeTurn.ts` to Twin-stick `rt.stick.edgeTurn` and One-finger `thumbTurn`, dropping `./trackpadFlight` and `sustainedEdges`.
2. **MB-2 (`runtime.ts` `exitOwnPointerLock`/`unlockExpected` & `flowFlight`):** Accepted. Moved `unlockUntil` to module-level state in `runtime.ts`, preserved `exitOwnPointerLock()`/`unlockExpected()`, and explicitly dropped `setFlowThrottle`/`startFlow`/`./flowFlight`.
3. **MB-3 (Omitted Gesture Lab consumers, `shoveBase` aliasing, dead `tapMark.ts`):** Accepted. Added `CombatTarget.tsx`, `Suit.tsx:74`/`suitPose.ts`, and `tests/flight-weight.test.ts:204`; added `setVec(baseScratch, ...)` guard in `Player.tsx:121`; deleted dead `tapMark.ts` and `data-touch-blast`.
4. **MB-4 (Exact tuning constants & live `FACING_FAST`):** Accepted. Corrected constants to exact source values (`TRACK_FRAMES = 64`, `TRACK_DRONES = 8`, `GHOST_MS = 80`, `R_EFF_MIN = 28`, `R_EFF_PAD = 18`, `TAP_SLOP_TOUCH = 10`, `TAP_MS = 250`) and preserved `FACING_FAST = { yaw: .6, pitchUp: .7, pitchDown: .9 }` in `presentation.ts`.
5. **MB-5 (Omitted `useAudio.ts`, `hintSteps.ts`, `TouchControls.tsx`, `limit-baseline.json`):** Accepted. Added all 3 source files and specified dropping only `openAir[2]` from `limit-baseline.json`.
6. **MB-6 (Hybrid-device modal limbo & orphaned files):** Accepted. Unified touch predicate (`useTouchCapable`), mounted sheet whenever `bar && (touchCapable || state.controlsOpen)`, cleared `controlsOpen: false` on `Flight settings`, and added `ControlsPicker.module.css`, `SheetLost.tsx`, and `carve.ts` to deletions.
7. **MB-7 (Duplicate `aria-live` in `BattleHud.tsx`):** Accepted. Retained the single existing `aria-live="polite"` region at `BattleHud.tsx:92`.
8. **Optional Improvements 1–3 (`suitBlaster`/`ShotFx` contracts, `useInput.ts` cleanup, dead store/thumb/CSS/autoFire/audio/test helpers):** Accepted into `r2`.

### Round 2 (`r2`) — All 4 Surgical Blockers + 5 Optional Improvements Accepted & Resolved in `r3`
1. **MB-1 (`controlsOpen` lifecycle, `Escape` routing, scheme-switch remount):** Accepted. Added `controlsOpen: false` in `pause()` and `resume()`, `!state.controlsOpen` guard on `Escape` in `useInput.ts:44`, and `clearInput()` + `exitOwnPointerLock()` + `inputEpoch + 1` + `persistGame()` on touch scheme switch.
2. **MB-2 (`stepSuitBlaster` same-frame fault cleanup):** Accepted. Restored two sequential `if` blocks and gated `handLink.forearm` on `!shooterFaulted()`.
3. **MB-3 (`shooterKeys.ts` / `useShooterInput.ts` / `desktop-flight.test.ts` contract):** Accepted. Replaced nonexistent `shooterKeyAction` with the exact `ShooterEnv`, `lockedClickFire`, `swallowsPress`, `keyDown`, `mouseDown`, `lookSourceFor` contract and removed `runtime.trackpad.capture`.
4. **MB-4 (`tests/pilot-flight.test.ts:27,37`):** Accepted. Explicitly specified removing `runtime.trackpad.active = false` and `runtime.trackpad.held = false` in surviving tests.
5. **Optional Improvements 1–5 (`fxPools.ts` zero-jet steam + `tracerOrigin` signature, `PERSISTED_KEYS` naming, `handLink.ts` private `FIT`, forced-colors `.reticle` rule, `useTouchCapable()` reuse & `gestureLog.ts` `Sample` spread):** Accepted into `r3`.

## Remaining Limitations

- Per EGM workflow guidance (allow one targeted re-review without looping indefinitely), `r3` incorporates all 4 concrete mechanical fixes from Round 2 directly and relies on `tsc --noEmit`, Vitest (including golden `limit-baseline.json`), static import-graph reachability, host Playwright E2E, and Chrome/WebKit visual checks to verify implementation.
- Physical iPhone and native macOS Safari testing remain outside local Playwright emulation.
