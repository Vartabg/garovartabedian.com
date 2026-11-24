# EGM Design Review Report: The Storm on the Lake (Mark 4:35–41)

- **Reviewed Plan:** `docs/plans/storm-on-the-lake.md` (Revision 1 -> updated to Revision 2)
- **Baseline:** `64e39a70` (`codex/storm-on-the-lake`)
- **Reviewer:** Fresh-context independent review via `agy --model gemini-3.8-flash-high --mode plan --sandbox` (isolated temporary workspace `/tmp/egm-storm`, zero tool calls, plan + `_shared/` contracts + `play/page.tsx` inlined)
- **Completion Evidence:** Exit code `0`, empty stderr, complete structured review written to `/tmp/egm-storm/review.out`.

## Findings & Dispositions

### Material Blockers (all 5 accepted and integrated into Revision 2)
1. **Pitching boat visual transform breaks world-space pointer hit-testing & tap-to-walk** -> **Accepted.** `stormView.ts` applies the exact inverse transform (`R(-pitch)` and `y - heave` around `(625, 320)`) inside `toWorld`, simplifying to identity under `prefers-reduced-motion`, with unit test verification.
2. **30/120 Hz arrival determinism & asymmetric headwind vector decomposition** -> **Accepted.** Scalar speed selects deterministically by horizontal motion sign (`146` east / `232` west / `200` vertical during storm; `220` calm) with exact sub-frame arrival interpolation (`start + walked / speed`).
3. **Sharp storm-to-calm audio cut prevented by `0.28 s` ambient time constant** -> **Accepted.** Added backwards-compatible optional `rampSeconds = 0.28` parameter to `setAmbientTarget(gain, rampSeconds)` in `_shared/storyAudio.ts`; `stormSound.ts` cuts ambient storm wind with `0.035 s` time constant on `still` and bounds periodic surf bursts to `<= 0.32 s`.
4. **Short Safari landscape headroom over-promised simultaneous mast peak + hull bottom** -> **Accepted.** Framed cleanly in world units (`height / scale`) with `fitVerticalCamera(STORM_HEIGHT, 412, 128, 0.77, ...)` guaranteeing deck plane, player, oar bench, bailing wells, and sleeping/standing Jesus remain in view while the mast tip clips gracefully on extreme landscape screens.
5. **macOS case-insensitive APFS filename collision hazard (`stormGame.ts` vs `StormGame.tsx`)** -> **Accepted.** Enforced `stormGame.ts` + `StormStage.tsx` + `StormReading.tsx`.

### Optional Improvements (all 4 accepted and integrated into Revision 2)
1. Discrete per-task completion timestamps (`at: number | null`) on `s.tasks` for deterministic phase progression.
2. `act(s)` auto-approaches nearest remaining active task when away from targets in `launch`/`squall`/`wake`.
3. Explicit dark-mode foreground/background tokens on `.storm-page` and `.storm-reading blockquote`.
4. Explicit descriptive `<Image alt>` string for `/jesus/life/calming-the-storm.jpg` on `/scriptures/stories/play`.

## Remaining Limitations
- Live speaker loudness/timbre of the storm-to-silence Web Audio transition and physical iOS Safari touch/VoiceOver gestures are not verifiable in headless CI.
