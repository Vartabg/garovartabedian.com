# Independent EGM review of From Noise to Dusk

- **Reviewer**: Gemini 3.8 Flash High (`gemini-3.8-flash-high`), fresh isolated Antigravity CLI session in `/tmp/egm-temple-noise-to-dusk` (`--mode plan --sandbox`, zero tool calls).
- **Reviewed revision & reading list**: `docs/plans/temple-noise-to-dusk.md` (Revision 1) against baseline `90b5af91`, with `playable-stories-design.md`, Mark 11:15–19 & Matthew 21:12–17 (WEB), `courtGame.ts`, `courtController.ts`, `courtSound.ts`, `courtView.ts`, `TempleGame.tsx`, `TempleReading.tsx`, `tests/overturned-tables.test.ts`, and `tests/e2e/playable-stories-navigation.spec.ts`.
- **Completion evidence**: Session `47f2f17f-7dbe-4c66-aec3-e2d983bab292` completed cleanly with `result.status = "SUCCESS"`, exit code `0`, empty stderr, zero tool calls, in `219.2 s`.

## Findings and dispositions

### Material blockers (all 3 accepted and resolved in Revision 2)
1. **HUD diffing stagnation in `publish()` (`courtController.ts`)** — *Accepted.* Updated `publish()` to track the unified active near target `(courtComplete(s) ? nearbyEncounter(s) : nearby(s))?.id` so approaching Act II/III encounters immediately updates the primary action label (`Heal`, `Answer scribes`, `Leave at evening`).
2. **`stepCourt` arrival ignoring encounters (`courtGame.ts`)** — *Accepted.* Added unified `targetFixture ?? targetEncounter` lookup in `stepCourt` so approaching an encounter stops at `REACH = 62` and invokes `resolveEncounter()` on arrival.
3. **Sound dispatch mismatch on Act I stalls (`courtController.ts`)** — *Accepted.* Specified explicit branching: dispatch `'heal' | 'answer' | 'depart' | 'teach'` directly from `s.actionKind`, while keeping Act I fixture sound lookup (`struck?.kind ?? 'air'`) intact.

### Optional improvements (all 6 accepted in Revision 2)
1. **Status message sequencing at Act II completion** — *Accepted.* Appends the dusk invitation sentence directly onto the 3rd Act II encounter's `s.message`.
2. **Scribe coordinate alignment** — *Accepted.* Standardized on `(884, 214)` across `courtGame.ts` and `courtView.ts`.
3. **Explicit pointer hit-box metrics** — *Accepted.* Added explicit bounding boxes for all 4 Act II/III encounters in `hit()`.
4. **Act II entry choreography** — *Accepted.* Defined exact spawn archways, arrival timing, and non-overlapping resting coordinates for the lame visitor, blind visitor, children, listeners, and scribes.
5. **Preserve `readHud(s).teachingStep`** — *Accepted.* Kept `teachingStep` alongside `card` in `readHud(s)` so existing unit assertions stay exact.
6. **Edge-triggered `'dusk'` cue** — *Accepted.* Added `duskSoundPlayed` controller flag reset cleanly in `reset()`.

## Remaining limitations
- Static review cannot assess runtime twilight palette legibility, healing-pose visual clarity, or speaker balance of the new audio cues; these will be verified via live desktop/mobile screenshots and automated browser/a11y checks after implementation.
