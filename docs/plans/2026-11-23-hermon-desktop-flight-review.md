# Mount Hermon Desktop Flight & Calm Exploration — EGM Review Report

- **Plan reviewed:** `docs/plans/2026-11-23-hermon-desktop-flight.md` (`r1` -> `r2`)
- **Source baseline:** `54f8c89d` (`master`), linked worktree `codex/hermon-desktop-flight`
- **Reviewers:** Two fresh-context read-only subagent runs (`research`, Gemini Pro) with zero parent conversation transcript and an explicit minimum reading list.

## Completion Evidence

1. **Initial review (`r1`, conversation `515cd879-6c2b-45af-8f32-8c12b7bd1607`):** Read all 23 supplied files (plan, design brief, `AGENTS.md`, `Research-Vault` 3D web guidance, core game/UI/world modules, and `tests/e2e/hermon-stories.spec.ts`). Returned **BLOCKED** with 6 material blockers (`MB-1` through `MB-6`) and 6 optional improvements.
2. **Targeted re-review (`r2`, conversation `5973e059-6c2b-45af-8f32-8c12b7bd1607`):** Verified all 17 targeted source/plan/test files against `r2`. Returned **PASS** with 0 remaining material blockers and 6 brief non-blocking implementation notes.

## Findings & Dispositions

| ID | Summary | Disposition |
| --- | --- | --- |
| MB-1 | `Space` takeoff/rise conflicted with `runtime.lift` landing logic and button `Tab + Space` activation. | **Accepted in r2.** Separated `runtime.lift` (takeoff-only) and `runtime.land` (explicit landing/cancel); excluded `Space` on buttons/dialogs/inputs. |
| MB-2 | Desktop `F`/`Ctrl` touchdown via `computedGrounded()` alone would be stopped 0.45 m above terrain by `limitStep` and cancelled by `Player.tsx:92`. | **Accepted in r2.** Added `desktopLandStep(ctx)` before `readIntent()`/`limitStep` using `runtime.keyDescendUsed` so `readIntent()` drops descend `-1` once landing engages; left `touchLandStep` untouched. |
| MB-3 | Toggling `Watchers` mid-flight inside `<Scene>`'s single `<Suspense>` would suspend `<Physics>` while `watcher.glb` loaded; header button focus could re-toggle on `Space`. | **Accepted in r2.** Wrapped `<ShooterLayer />` in its own `<Suspense fallback={null}>` inside `<Physics>`, prevented mousedown focus + blurred on desktop click, and centralized `Watchers` toggle reset/cleanup. |
| MB-4 | Missing store contract for active tablet ID/label and `FieldGuide` deep-link across `Player.tsx`, `HintSlot.tsx`, and `useInput.ts`. | **Accepted in r2.** Added runtime-only `nearTerminalId`, `nearTerminalLabel`, `journalTerminalId`, and `pointerLocked`, plus one shared `openTabletRecord()` helper. |
| MB-5 | `useInput.ts:66` killed Shift surge on `WASD` release; `lookSensitivity`/`invertY` bypassed mouse mode; `SHIELD.mouse`/`SHIELD.keys` clearing gaps; `KeyB` duplicate listener & shield drop; `<Reticle />` remained in calm flight; omitted lab/hint files in Section 3. | **Accepted in r2.** Fixed all wiring, updated Section 3 file list, and scoped desktop `ControlsEntry`/`controlKeys`/`ControlsHint`/`FlightFeel`/`ShooterHud`. |
| MB-6 | `celestialBattle.ts` engagement rule vs `Battle.tsx` caller and test coverage scope (`tests/persistence.test.ts`, `tests/e2e/hermon-stories.spec.ts`). | **Accepted in r2.** Verified `Battle.tsx:24` already gates dart charging on `!s.paused && s.flying` and resets on mount; scoped `desktop-flight.test.ts` and updated `hermon-stories.spec.ts`. |
| Opt 1–6 + r2 notes | Safari pointer capture release before lock, `touchMode()` hybrid gating, retire `KeyQ` ADS & `"Suit"` message, `TabletBeacons` white base color + `fog: false` + demand-mode discipline, `discoveredTablets` sanitization, `L` feedback, `journalTerminalId` reset, `Telemetry` status independence, `Modal` outside-click drag guard. | **All accepted** for implementation. |

## Remaining Limitations

- Physical iPhone / physical macOS Safari verification remains separate from headless Chrome/Playwright WebKit checks and will be noted transparently in the final report.
