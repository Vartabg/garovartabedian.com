# EGM Design Review Report: Shared 2D Playable Story Primitives (`_shared/`)

- **Reviewed Plan:** `docs/plans/playable-stories-shared.md` (Revision 1 -> updated to Revision 2)
- **Baseline:** `6ea9e9e1` (`codex/playable-stories-shared`)
- **Reviewer:** Fresh-context independent review via `agy --model gemini-3.8-flash-high --mode plan --sandbox` (isolated temporary directory `/tmp/egm-playable-shared`, zero tool calls, plan + 6 controller/pointer/sound source files inlined)
- **Completion Evidence:** Exit code `0`, empty stderr, complete structured review written to `/tmp/egm-playable-shared/review.out`.

## Findings & Dispositions

### Material Blockers (all 5 accepted and integrated into Revision 2)
1. **Ambient interval teardown on pause would permanently silence ambient ticks after resume** -> **Accepted.** Keep `ambientTimer` registered across pause/blur (gated by `!enabled || paused || audio.state !== "running"` + gain ramp + `suspend`/`resume`) and clear strictly in `close()`.
2. **Canvas resize/restoration while paused drops `dirtyPaint` repaint** -> **Accepted.** `runStoryStage` owns `dirtyPaint` and runs one `onDraw(0, reduced)` pass on resize, `contextrestored`, or explicit `requestPaint()` even while paused.
3. **Missing bidirectional pause/visual sync between `storyStage` and React HUD** -> **Accepted.** Added `onPauseChange`, `onVisualChange`, and returned `StoryStageController` (`togglePause`, `setPaused`, `isPaused`, `requestPaint`, `clearInput`, `reduced`, `dispose`).
4. **Tap hit-testing return type mismatch (`courtPointer` returns `Fixture`, `elahPointer` returns `string`)** -> **Accepted.** `attachStoryPointer` remains strictly a gesture/projection controller emitting `onTap(worldPoint)`; each episode performs its own hit test.
5. **Preserving `courtController`'s `departedAt` guard and keyboard audio unlock** -> **Accepted.** `storyStage` delegates Space/Enter solely to `onPerform()` and invokes `onInteract()` on valid keyboard/pointer interaction.

### Optional Improvements (all 4 accepted and integrated into Revision 2)
1. Forward `reduced` motion flag into `onStep(dt, x, y, now, reduced)` for `elahController`'s sling whirl audio.
2. Preserve outer `<section>` keyboard containment guard alongside interactive element checks.
3. Reset delta clock (`last = 0`) on pause, resume, and reset (`clearInput()`).
4. Support configurable deterministic noise `seed` in `createStoryAudio` (`0x51a7c3` for Temple, `0x73e9a1` for Elah).

## Remaining Limitations
- Automated tests verify DOM/lifecycle behavior in jsdom and headless Chromium; live Web Audio speaker timbre and physical iOS Safari touch/VoiceOver gestures are not verifiable in headless CI.
