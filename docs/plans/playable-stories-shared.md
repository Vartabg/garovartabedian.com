# Shared 2D Playable Story Primitives (`_shared/`)

Revision 2, against baseline `6ea9e9e1` (branch `codex/playable-stories-shared`), incorporating all independent EGM review findings.

## Goal

Before adding Episode 3 of the 2D playable Scripture stories, extract the genuinely duplicated canvas-runtime boilerplate shared between `/scriptures/stories/play/overturned-tables` and `/scriptures/stories/play/valley-of-elah` into a small, focused, zero-dependency private folder at `src/app/scriptures/stories/play/_shared/` — without altering any public route, HUD/DOM contract, gameplay physics, or visual output.

## Scope and consequential decisions

### 1. Extracted modules in `src/app/scriptures/stories/play/_shared/`
1. **`storyInk.ts`**:
   - Cached `Path2D` primitives (`print`, `polygon`, `line`, `stone`, `oval`).
   - Shared in-world overlays (`drawGuideMarker`, `drawEdgeArrow`) and pure camera headroom helper `fitVerticalCamera(worldHeight, floorBottom, maxHeadroom, headroomRatio, visibleHeight, feetY)`.
   - `courtView.ts` and `elahView.ts` keep their exported `verticalCameraTop(visibleHeight, feetY)` signatures.
2. **`storyPointer.ts`**:
   - Pure gesture + projection controller `attachStoryPointer(canvas, { signal, active, toWorld, onTap })` owning the 8 px drag deadzone, `Math.max(28, distance)` steering radius, pointer capture cleanup, and world coordinate tap projection. Domain hit-testing remains inside each episode controller.
3. **`storyAudio.ts`**:
   - Shared procedural Web Audio engine `createStoryAudio({ seed, ambientFreq, ambientQ, ambientTickMs, onAmbientTick })` managing lazy `AudioContext`/`webkitAudioContext` unlock, `master -> destination` / `sfx -> master` / `ambientGain -> master` routing, deterministic seeded white-noise buffer (`0x51a7c3` default; `0x73e9a1` for Elah), auto-disconnecting `tone(...)` and `noise(...)`, and looping ambient bed.
   - `ambientTimer` stays registered across pause/blur cycles (guarded by `!enabled || paused || audio.state !== "running"` plus master gain ramp + suspend/resume) and is cleared strictly during `close()`, so unpausing never silences procedural ambient audio.
4. **`storyStage.ts`**:
   - Unified browser stage lifecycle `runStoryStage(canvas, hooks)` returning `StoryStageController` (`togglePause`, `setPaused`, `isPaused`, `requestPaint`, `clearInput`, `reduced`, `dispose`).
   - Owns `WASD`/Arrow `held` key state, outer `<section>` containment guard + interactive-element exclusions (`summary, a, input, textarea, select`, plus `!target?.closest("button")` on Space/Enter), `KeyP`/`Escape` pause handling, `window.blur` and `document.visibilitychange` auto-pause, `ResizeObserver`, `contextlost`/`contextrestored`, `dirtyPaint` (so resizes/restorations while paused repaint once cleanly), `last = 0` clock reset on pause/resume/reset, `onInteract` audio unlock hook, and forwarding `reduced` into both `onStep(dt, x, y, now, reduced)` and `onDraw(dt, reduced)`.
   - Delegates Space/Enter strictly to `onPerform()` so episode guards (e.g. `courtController`'s `departedAt !== null`) remain intact.

### 2. Boundaries NOT extracted
- Simulation (`courtGame.ts`, `elahGame.ts`), scenery/actors/props, React components (`TempleGame.tsx`, `ValleyGame.tsx`), and CSS (`temple.css`, `elah.css`) stay self-contained per episode.
- Next.js `_shared/` private folder prefix guarantees zero public routes are generated.

## Observable acceptance checks
1. `tests/playable-story-shared.test.ts` verifies `fitVerticalCamera`, `createStoryAudio` silent-fallback & pause/resume/close lifecycle (confirming ambient ticks resume after pause and stop after `close()`), and `runStoryStage` keyboard containment, pause/resume clock reset, `dirtyPaint` while paused, `contextlost`/`contextrestored`, and teardown contracts.
2. All existing tests (`tests/overturned-tables.test.ts`, `tests/valley-of-elah.test.ts`, `tests/site-xray.test.ts`, and all 7 Playwright specs in `tests/e2e/playable-stories-navigation.spec.ts`) pass unchanged.
3. Full `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` (confirming no `_shared` route in Next.js output), and live Axe WCAG 2.2 AA check on both episodes pass with zero regressions.
