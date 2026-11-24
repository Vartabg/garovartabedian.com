# EGM Design Review — Playable 2D Scripture Stories Engineering & Gaming Pass

- **Reviewed plan:** `docs/plans/playable-stories-gaming-pass.md` (Rev 1 → resolved in Rev 2)
- **Source baseline:** `7afa53cb` (`master`)
- **Reviewer:** Fresh-context sandboxed `agy --sandbox --print` in `/tmp/egm-gaming-pass` (`EGM_EXIT=0`, 0 tool calls, full plan + `_shared/*` + `playable-story-shared.test.ts` + `stormGame.ts` + `elahGame.ts` + `playable-stories-design.md` inlined)
- **Completion evidence:** Saved and verified `/tmp/egm-gaming-pass/review.md` (17,400 bytes, 7 Material Blockers, 5 Optional Improvements)

## Dispositions of Material Blockers

1. **Storm rogue-wave rapid `bail-1 → bail-2`, task permutations, and early `wakeJesus` race** — **Accepted & resolved in Rev 2.** Specified monotonic water targets keyed by `squallDoneCount(s)` (`0.62 / 0.78 / 0.90`), pre-settling any active `pendingWave` on consecutive bails, clamping `reef` + wave monotonically via `Math.max`, silently settling `pendingWave` inside `wakeJesus()` (no shake/hit-stop over Mark 4:38 card), adding `waveHitSeq` + `s.seq++` on wave impact, and removing the redundant `hit` boolean.
2. **Storm stillness wavefront zeroed on frame 1 by `s.stormIntensity = 0` + inverted compass wording** — **Accepted & resolved in Rev 2.** Added `calmFromIntensity` preserved on `speakStillness()` so the renderer's `1.25 s` expanding wavefront visually flattens waves **west-to-east (stern to bow)** while `s.stormIntensity` stays immediately `0` for state invariants.
3. **Hold-to-wind sling `Space`/`Enter`/pointer race conditions** — **Accepted & resolved in Rev 2.** Specified full capture handshake (`onActionDown() => boolean` suppressing `onPerform`, `onActionUp` guarded by `actionHeld`, `onActionCancel` on `clearInput`/pause/blur, plus `storyPointer` `onHoldStart`/`onHoldEnd`/`onHoldCancel` cancelling cleanly if drag exceeds `8 px` or pointer cancels).
4. **`ActionBuffer` (`140 ms`) conflict with synchronous `act()` fallbacks & wall clock** — **Accepted & resolved in Rev 2.** Made `ActionBuffer` strictly `dt`-driven in `storyMotion.ts`, active only while the player is moving (`walking || destination !== null`) and cleared on pause/reset/phase change; standing still continues to run `act(s)` synchronously.
5. **Idle-pause rAF stop/wake, DPR resize, `dispose()` guard & existing test mock** — **Accepted & resolved in Rev 2.** Added `disposed` guard, `frame = 0` reset before callbacks, `last = 0` on idle sleep, `onResize() + dirtyPaint = true + ensureFrame()` on DPR change (guarded for JSDOM), and updated `tests/playable-story-shared.test.ts` to verify true idle rAF shutdown and wake.
6. **`storyAudio.ts` pre-unlock filter caching, `FakeAudioContext` compatibility & delayed `suspend()` guard** — **Accepted & resolved in Rev 2.** Retained `ambientFilter` + `ambientFreqTarget`/`ambientQTarget` before unlock, added `.value` fallback when `setTargetAtTime` is absent on mocks, and guarded delayed `suspend()` with `audio.state === 'running' && (!enabled || paused)` plus timer cancellation on resume/`close()`.
7. **Hit-stop visual boundary, Elah brook-edge determinism & velocity clamping** — **Accepted & resolved in Rev 2.** Confined hit-stop & shake strictly to view layers; kept uniform speed across Elah's brook bank (paired with physical wading splashes/sound) so 30/120 Hz remains `< 1e-6` everywhere; zeroed clamped velocity axes and reset velocity on `approach`/phase transitions; clarified Unit 4 coin ricochets stay outside standing `obstacleBox`es while player/fixture arrival stays `< 1e-6`.

## Dispositions of Optional Improvements

- All 5 accepted in Rev 2: single optional `detuneCents = 0` param on `tone(...)`; explicit `drawHoverRing`/`drawDragCompass` CSS-pixel transform space and `dragState.active` gated on `drag.moved`; touch hover ignored & hover cleared on `pointerleave`/`clearInput()`; `inkCacheSize()`/`clearInkCache()` exported for tests; explicit file lists for Units 2–4; explicit westward forward fall for Goliath (`1 Samuel 17:49`) and smooth-over-rough stone hit priority; newly overturned stall excluded from Unit 4 `stirCoins` obstacles.

## Remaining Limitations
- Visual/audio perceptual tuning (speaker loudness balance and real iPhone touch ergonomics) remains verified via desktop/mobile Playwright screenshots and automated audio-graph tests rather than physical hardware speakers/touchscreen.
