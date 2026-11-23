# The overturned tables: From Noise to Dusk (Three-Beat Playable Arc)

Revision 2, against baseline `90b5af91` (branch `codex/temple-noise-to-dusk`), incorporating all independent EGM review findings.

## Goal and user direction

Extend `/scriptures/stories/play/overturned-tables` from a single clearing beat into a cohesive **three-beat playable arc** inside the same limestone courtyard using the same controls:

1. **Act I — Clear the Market** *(preserved verbatim)*: Overturn 3 money tables and 2 dove seats, and bar the east passage (Mark 11:15–16; John 2:15).
2. **Act II — Restore the House** *(new playable layer)*: Once the market clears, a lame visitor, a blind visitor, and two praising children enter the open floor while the chief priests and scribes step forward at the colonnade edge (Matthew 21:14–16; Mark 11:17–18). The same Space/tap action shifts from *shove* into **Heal** and **Answer scribes**.
3. **Act III — Evening Departure** *(new closing beat)*: After healing both visitors and answering the scribes, warm afternoon light deepens into Jerusalem dusk across the court and eastern hills. Walking to the east archway and choosing **Leave at evening** sends Jesus quietly up the steps toward Bethany (Mark 11:19; Matthew 21:17).

- **Guardrails**: Zero countdowns, zero points, zero fail states, zero combat, zero external audio/image assets, zero server writes. Every existing unit test (12), E2E test (5), short mobile Safari headroom invariant, reduced-motion mode, no-JS Gospel reading, and WCAG 2.2 AA contract remains intact.

## Scope and consequential decisions

### 1. Simulation state, encounters, and unified `stepCourt` (`courtGame.ts`)
- Keep `s.fixtures` strictly as the 6 Act I market targets (`table-1..3`, `seat-1..2`, `gate`) so `fixtures.length === 6`, `courtComplete(s)`, and `s.seq === 6` at Act I completion stay unbroken.
- Add `encounters: Encounter[]`, `departedAt: number | null`, and `cardKind: CardKind` (`'teach' | 'heal' | 'answer' | 'depart'`) on `Court`:
  - `heal-lame`: `{ id: 'heal-lame', label: 'Lame visitor', kind: 'lame', x: 162, y: 368, at: null }`
  - `heal-blind`: `{ id: 'heal-blind', label: 'Blind visitor', kind: 'blind', x: 462, y: 232, at: null }`
  - `scribes`: `{ id: 'scribes', label: 'Chief priests and scribes', kind: 'scribes', x: 884, y: 214, at: null }`
  - `depart`: `{ id: 'depart', label: 'East archway (evening)', kind: 'depart', x: 1185, y: 224, at: null }`
- Every Act II encounter sits at elliptic `distance >= 143` from every Act I fixture (`> 2 * REACH = 124`), guaranteeing `nearbyEncounter(s) === undefined` and `readHud(s).action === "Teach"` immediately at Act I completion regardless of completion order.
- Activation rules:
  - `activeEncounters(s)` returns `[]` during Act I; undone `'lame' | 'blind' | 'scribes'` during Act II; `['depart']` once all three Act II encounters finish (`eveningReady(s) === true`) until `departedAt !== null`; `[]` once departed.
  - `eveningAt(s)` returns the max `at` across the three Act II encounters once all three are done, else `null`.
- Unified target lookup in `approach(s, id)` and `stepCourt(s, dt, dx, dy)`:
  - Resolves `targetFixture` from `s.fixtures`, else `targetEncounter` from `activeEncounters(s)`.
  - Both stop cleanly at `REACH = 62` and invoke `shove()` (for fixtures) or `resolveEncounter()` (for encounters) on arrival.
- Encounter resolution (`resolveEncounter`):
  - `'lame'` / `'blind'` → sets `enc.at = at`, `actionKind = 'heal'`, `cardKind = 'heal'`, `shoveAt = at`, `seq++`, faces encounter.
  - `'scribes'` → sets `enc.at = at`, `actionKind = 'answer'`, `cardKind = 'answer'`, `shoveAt = at`, `seq++`, faces encounter.
  - When the third Act II encounter completes (`eveningReady(s)`), appends `' Evening settles over the court. Walk out through the east archway, or keep teaching.'` to `s.message`.
  - `'depart'` → sets `enc.at = at`, `s.departedAt = at`, `actionKind = 'depart'`, `cardKind = 'depart'`, `shoveAt = at`, `seq++`, cancels movement, faces `1`.
  - When `courtComplete(s)` and `s.departedAt === null` and no encounter is within reach, `act(s)` continues cycling `teachingStep` (`0 -> 1 -> 2 -> 0`) with `actionKind = 'teach'` and `cardKind = 'teach'`.
- When `s.departedAt !== null`: `stepCourt` advances `s.time` and settles coins/feathers while ignoring player steering, `act()`, `approach()`, and `walkTo()` until `newCourt()`.

### 2. Visual storytelling, hit boxes, and choreography (`courtPeople.ts`, `courtProps.ts`, `courtView.ts`)
- Expand `PersonRole` with `'lame' | 'blind' | 'child'` and `PersonPose` with `'heal' | 'lame' | 'blind' | 'praise'`.
  - Lame visitor enters from west edge `(-26, 368)` → `(162, 368)` over `clearAge ∈ [0.25, 2.3]` leaning on a drawn wooden staff; upon healing, the staff lies on the paving beside their feet and they stand upright in gratitude.
  - Blind visitor enters from rear arch bay 4 `(513, 158)` → `(462, 232)` over `clearAge ∈ [0.45, 2.1]` with bowed head and guide reed; upon healing, they lift their face toward the light.
  - Two praising children (`scale 0.68`) enter from arch bay 5 `(632, 158)` → `(612, 250)` and `(658, 260)` over `clearAge ∈ [0.55, 2.2]` holding green olive/palm sprigs (Matthew 21:15).
  - Two quiet adult listeners stand at `(332, 232)` and `(720, 234)` (well clear of all Act II targets).
  - Chief priests & scribes step to `(876, 208)` and `(916, 212)` around encounter point `(884, 214)`; after being answered, they withdraw slightly back into the colonnade shade (`y ≈ 194`).
  - Jesus’s `'heal'` pose extends one calm compassionate hand accompanied by a subtle warm ivory-gold glow (softened/static under reduced motion).
- Explicit pointer hit boxes in `courtView.ts` `hit(s, p)` for active encounters:
  - `heal-lame (162, 368)`: `|x - 162| < 42 && y > 304 && y < 388`
  - `heal-blind (462, 232)`: `|x - 462| < 38 && y > 168 && y < 252`
  - `scribes (884, 214)`: `x > 844 && x < 944 && y > 152 && y < 236`
  - `depart (1185, 224)`: `|x - 1185| < 54 && y > 120 && y < 256`
- Act III Jerusalem dusk (`dusk = clamp((time - eveningAt) / 2.2, 0, 1)`, instant under `reduced`):
  - Twilight amber-rose sky gradient inside the clipped east archway opening, warm sunset paving tint (`rgba(174, 92, 46, 0.18 * dusk)`), and soft sunset rim on the eastern steps.
  - Upon `departedAt !== null`, Jesus walks steadily over `2.6 s` (instant under `reduced`) to `(1185, 224)` and up the steps to `(1185, 172)`, scaling `1.0 -> 0.84` and fading softly onto the Bethany road.

### 3. Soundscape & controller dispatch (`courtSound.ts`, `courtController.ts`)
- Expand `SoundKind` with `'heal' | 'answer' | 'dusk' | 'depart'`, routed through `masterGain` / `sfx` with full pause/mute/visibility/dispose lifecycle.
- Controller `change()` dispatch rule:
  - If `s.actionKind` is `'heal' | 'answer' | 'depart' | 'teach'`, play `sound.play(s.actionKind)`.
  - Otherwise (Act I actions), keep `const struck = s.fixtures.find(f => f.at === s.shoveAt); sound.play(struck?.kind ?? "air");`.
- Add `let duskSoundPlayed = false;` edge trigger: play `sound.play('dusk')` once when `eveningReady(s) && !duskSoundPlayed`; reset to `false` in `reset()`.
- Update `publish()` diff check to watch unified near target `const near = (courtComplete(s) ? nearbyEncounter(s) : nearby(s))?.id`, plus `s.seq`, `s.teachingStep`, and `s.departedAt !== null`.

### 4. HUD, Teaching Card, Targets & Reading (`courtController.ts`, `TempleGame.tsx`, `TempleReading.tsx`, `temple.css`)
- `readHud(s)` keeps `teachingStep: s.teachingStep` intact and adds:
  - `card`: `{ heading, quote, ref, href }` (Mark 11:17–18 for `teach`, Matthew 21:14 for `heal`, Matthew 21:16 for `answer`, Mark 11:19 for `depart`).
  - `encounters`: active/completed Act II & III encounter buttons for `<details className="court-targets">` (appended only when `courtComplete(s)` so Act I target list is unchanged and disabled count right at Act I completion stays `6`).
  - `actTwoDone`, `evening`, `departed`.
- Primary action button label: `Heal` / `Answer scribes` / `Leave at evening` / `Teach` during Act II–III; hidden once `hud.departed` so `Play again` is prominent.
- `TempleReading.tsx` adds a direct link to Matthew 21:12–17 beside Mark 11:15–19 and John 2:13–17 and states clearly what each Gospel supplies vs. what is imagined for play.

## Observable acceptance checks

1. All 12 existing unit tests and all 5 existing E2E tests pass unchanged.
2. New unit tests verify: elliptic distance `>= 143` between every Act I fixture and Act II encounter; Act II activation only after Act I; `approach()` + arrival on `heal-lame`, `heal-blind`, `scribes` in any order with matching `actionKind` and `readHud(s)` labels/cards; `eveningReady` unlocking `depart` only after all 3 Act II encounters; departure setting `departedAt`, freezing player motion, and resetting cleanly on `newCourt()`.
3. New E2E test completes the full 3-act Noise-to-Dusk playthrough (clear stalls & passage → heal both visitors → answer scribes → leave at evening → verify Mark 11:19 card and clean replay).
4. Visual inspection of live desktop, mobile portrait, and short mobile landscape screenshots across Act II (healing, children, scribes) and Act III (dusk & departure), plus Axe WCAG 2.2 AA in light & dark schemes across all acts.
