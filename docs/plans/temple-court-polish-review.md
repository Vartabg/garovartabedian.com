# Independent EGM review of the Temple courtyard polish

- **Reviewer**: Gemini 3.8 Flash High (`gemini-3.8-flash-high`), fresh isolated Antigravity CLI session in `/tmp/egm-temple-court-polish-2` (`--mode plan --sandbox`, zero tool calls).
- **Reviewed revision & reading list**: `docs/plans/temple-court-polish.md` (Revision 1) against baseline `54f8c89d`, with `temple-court-action.md`, `temple-court-action-review.md`, Mark 11:15–19 (WEB), the full `overturned-tables` source modules (`courtGame.ts`, `courtCoins.ts`, `courtProps.ts`, `courtView.ts`, `courtSound.ts`, `courtController.ts`, `TempleGame.tsx`, `TempleReading.tsx`), and both test suites (`tests/overturned-tables.test.ts`, `tests/e2e/playable-stories-navigation.spec.ts`).
- **Completion evidence**: Initial run (`b23f3efd-f491-4a6c-ad69-e9672190cc1f`) hit the 2-minute `--print-timeout` and was discarded as incomplete. Fresh re-run (`878f3558-f1ae-42a2-aec7-4c8a8668f681`) with a 5-minute timeout completed cleanly with `result.status = "SUCCESS"`, exit code `0`, empty stderr, zero tool calls, in `201.1 s`.

## Findings and dispositions

### Material blockers (all accepted and resolved in Revision 2)
1. **Missing `teachingStep` in `CourtHud` & static teaching card (`courtController.ts`, `TempleGame.tsx`)** — *Accepted.* Added `teachingStep` to `readHud()` and `publish()` diff check, switched post-clear `action` to `"Teach"`, and bound `TempleGame.tsx`'s quote/link dynamically to `hud.teachingStep` while preserving `<h2>A house of prayer</h2>`.
2. **Audio dispatch mismatch on post-clear `act()` (`courtController.ts`, `courtSound.ts`)** — *Accepted.* Extended `sound.play()` with `'teach'` (plus `'coin'` and `'step'`) and dispatched `'teach'` directly from `s.actionKind` in `change()`.
3. **Underspecified collision hull & corner steering vs. 30/120 Hz determinism (`courtGame.ts`)** — *Accepted.* Defined player collision strictly as the 2D feet point against footprint rectangles incorporating clearance, specified exact analytical swept AABB entry/exit sliding, and moved `approach()` / `walkTo()` obstacle avoidance to static deterministic corner waypoints computed at call time.
4. **Ambient market audio missing pause/mute master control (`courtSound.ts`, `courtController.ts`)** — *Accepted.* Routed all audio through `masterGain` (with `ambientGain` feeding it), added `setPaused(paused)` and `updateAmbiance(remainingStalls, barred)`, and wired pause/blur/visibility/mute/dispose hooks in `courtController.ts`.

### Optional improvements (dispositions)
1. **Feather simulation vs. visual separation** — *Partially adapted.* Kept 5 lightweight `Feather` items right alongside `Coin` in `courtCoins.ts` so settling bounds (`178..424`) and foot-stirring stay deterministic and unit-testable without bloating `courtGame.ts`.
2. **Render-decoupled hit-stop (`courtView.ts`)** — *Accepted.* Visual 35 ms hit-stop is clamped purely in `courtView.ts` while `stepCourt()` continues untouched.
3. **Multi-pass render layering (`courtProps.ts`, `courtView.ts`)** — *Accepted.* Split spill rendering into `drawGroundScatter`, depth-sorted mid-air/actor rows, and `drawAerialSpill`.
4. **Scribes framing on short landscape screens (`courtView.ts`)** — *Accepted.* Positioned watching colonnade scribes at `y ≈ 196–204` near the column bases so they remain visible inside short mobile landscape framing.

## Remaining limitations
- The static review could not verify runtime audio loudness/balance, visual legibility of fallen scales/feathers/sunlight, or live mobile touch feel; those will be verified in browser checks and unit/E2E suites after implementation.
