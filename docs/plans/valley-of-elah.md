# The Valley of Elah: playable Judean valley vignette

Revision 2, against baseline `c9d57983` (branch `codex/valley-of-elah`), incorporating all independent EGM review findings.

## Goal and user direction

Build Episode 2 of the 2D playable Scripture stories at `/scriptures/stories/play/valley-of-elah`, realizing the *Valley of Elah* concept recorded in `docs/plans/playable-stories-design.md` (1 Samuel 17:38–52):

- Let the player physically feel the **weight of Saul’s unfamiliar bronze armor** and the **exposure and lightness of setting it aside** piece by piece.
- Let the player wade into the **brook of Elah** to gather **five smooth stones**.
- Stage the **sustained challenge** across the open valley floor giving way to **one deliberate, untimed abstract sling action** (available via tap, Space/Enter, or named target button) and the **sudden movement of the two watching armies**.
- Match the etched-print 2D Canvas aesthetic, procedural Web Audio soundscape, deterministic testability, reduced-motion parity, no-JS reading, short mobile Safari headroom, and WCAG 2.2 AA standards proven by *The overturned tables* without modifying `overturned-tables/`.
- **Guardrails**: Zero countdown timers, zero twitch QTE windows, zero points/scores, zero graphic violence/gore (abstract dignified silhouette fall of the bronze champion; omitting 17:51 beheading visually), zero external runtime assets, zero persisted state or server writes.

## Scope and consequential decisions

### 1. World geometry, phases, and physical verbs (`elahGame.ts`)
- World canvas logical size: `ELAH_WIDTH = 1440`, `ELAH_HEIGHT = 460`, walkable valley floor `WALK_BOUNDS = { minX: 48, maxX: 1360, minY: 238, maxY: 416 }`, with progressive eastern soft bounds:
  - While `armorCount > 0`: `maxX = 495`. Attempting to step east past `495` clamps cleanly and sets status: `"I can’t go with these, for I have not tested them."` (1 Samuel 17:39).
  - While `armorCount === 0 && stonesPicked < 5`: `maxX = 645`. Attempting to step east past `645` clamps cleanly and sets status: `"Choose five smooth stones from the brook first."`
  - While `stonesPicked === 5 && releasedAt === null`: `maxX = 950` (keeping David west of Goliath's standoff line at `x = 1015`).
  - Once `releasedAt !== null`: `maxX = 1360` (full valley open for free roaming!).
- **Starting state (`newElah()`)**:
  - David spawns on Saul's western camp slope at `{ x: 168, y: 312 }`, facing `+1`, wearing all 3 pieces of Saul's armor (`armorLeft: ['sword', 'coat', 'helmet']`).
  - Walk speed scales strictly monotonically with carried armor:
    - `3 pieces`: `82 px/s`
    - `2 pieces`: `132 px/s`
    - `1 piece`: `188 px/s`
    - `0 pieces`: `256 px/s`
- **Unified phase & target contract**:
  1. **`armor` (`armorLeft.length > 0`)**:
     - Primary button & single contextual armor target button in `Valley targets` advance sequentially: `"Set aside sword"` → `"Set aside coat of mail"` → `"Set aside bronze helmet"`.
     - Triggerable immediately at `t = 0` via Space, primary button, tapping David/camp armor, or `Valley targets`. Each press drops that piece beside David's feet (`droppedArmor.push(...)`) and visibly lightens stride.
     - All 5 brook stone buttons in `Valley targets` are explicitly `disabled` while `armorLeft.length > 0`, and `approach()` ignores stone IDs until `armorLeft.length === 0`.
  2. **`brook` (`armorLeft.length === 0 && stonesPicked < 5`)**:
     - Five smooth river stones along the wadi brook: `stone-1 (558, 260)`, `stone-2 (536, 304)`, `stone-3 (582, 326)`, `stone-4 (548, 368)`, `stone-5 (592, 392)`.
     - Pickable in any order within `REACH = 58` via Space (`Pick smooth stone`), canvas tap, or `Valley targets` buttons (`Smooth stone 1..5`).
  3. **`approach` (`stonesPicked === 5 && challengeAt === null`)**:
     - Unified standoff target `meet` at `{ x: 785, y: 312 }` (`label: "Step into the valley"`).
     - Activating `meet` (walking within `REACH = 64` and pressing Space, tapping Goliath/valley floor standoff, or clicking `Step into the valley` in `Valley targets`) advances David smoothly to `{ x: 825, y: 312 }`, quotes 1 Samuel 17:47, and transitions directly to `phase = 'sling'`.
  4. **`sling` (`challengeAt !== null && releasedAt === null`)**:
     - **Untimed turning point**: David whirls his leather sling steadily with no timer or fail state.
     - Both the primary button and `Valley targets` expose **`Release stone`** (`id: 'release'`). Activating via Space, primary button, tapping Goliath/valley, or `Valley targets` sets `releasedAt = at` and launches the `0.42 s` abstract stone arc, transitioning to `phase = 'resolved'`.
  5. **`resolved` (`releasedAt !== null`)**:
     - Primary button transitions to **`Read verse`**, stepping through `CLOSING_VERSES`:
       - Step 0: *“Yahweh doesn’t save with sword and spear; for the battle is Yahweh’s.”* (`1 Samuel 17:47`, `/scriptures/protestant/1SA/17?t=web#v47`)
       - Step 1: *“So David prevailed over the Philistine with a sling and with a stone… but there was no sword in David’s hand.”* (`1 Samuel 17:50`, `/scriptures/protestant/1SA/17?t=web#v50`)
     - `Play again` resets cleanly to `newElah()`.
- **Determinism**: `stepElah(s, dt, dx, dy)` caps `dt <= 0.05`, ignores non-finite/non-positive `dt`, and agrees at `30 Hz` and `120 Hz` within `< 1e-6`.

### 2. Visual direction, camera headroom, and audio (`elahInk.ts`, `elahScenery.ts`, `elahPeople.ts`, `elahProps.ts`, `elahView.ts`, `elahSound.ts`)
- Etched Judean valley print (`1440 × 460`): pale sky, terraced western/eastern limestone ridges, Israelite goat-hair camp tents, King Saul watching on the west ridge, shimmering diagonal brook of Elah with water ripples underfoot, 18 watching soldiers on each hill ridge, towering bronze-clad Philistine champion (`scale 1.56`) & shield-bearer.
- Overhead sling headroom: `verticalCameraTop(visibleHeight, feetY)` reserves `Math.min(132, visibleHeight * .80)` above `feetY` so David’s feet, head, and overhead sling arc (~98 px above feet) stay cleanly inside the picture even on `129 CSS px` short Safari landscape viewports.
- On impact (`time >= releasedAt + (reduced ? 0 : 0.42)`): dignified horizontal bronze silhouette collapse in ochre dust (zero gore), Philistine ridge line breaks eastward in dust clouds, Israelite ridge line raises spears and surges across the background hillside!
- Procedural Web Audio (`elahSound.ts`): routed through `masterGain` / `sfx` / `ambientGain` with full pause, blur, visibility, mute, and dispose lifecycle; armor-weighted bronze clank steps vs. wet brook splashes vs. light dry earth steps; distinct armor drop clangs, wet stone clacks, challenge horn/cadence, leather sling whip-snap + distant bronze impact thud, and gentle valley wind bed.

### 3. Route registration & Playable Stories hub integration
- `src/lib/site-navigation.ts`:
  ```ts
  {
    href: "/scriptures/stories/play/valley-of-elah",
    label: "The Valley of Elah",
    note: "Shed Saul’s bronze armor, choose five smooth stones from the brook, and face Goliath.",
    parent: "/scriptures/stories/play",
  }
  ```
- `src/lib/scriptures/study-catalog.ts`: add `"/scriptures/stories/play/valley-of-elah"` to the `"stories"` group.
- `src/app/scriptures/stories/play/page.tsx`: promote David and Goliath to `<section className={styles.episode} aria-labelledby="elah-title">` using `/scriptures/stories/david/name.jpg` (`width={880} height={660}`, `className={styles.illustration}`, `sizes="(max-width: 38rem) 100vw, 20rem"`, descriptive `alt`), `<a className={styles.play} href={elah.href}>Enter the Valley of Elah</a>`, and preserving `Read David’s story` + `Read 1 Samuel 17` (`#v1`).
- `scripts/a11y/config.mjs` & `tests/a11y-runner.test.ts`: register `/scriptures/stories/play/valley-of-elah` (`routes.length === 95`).
- `docs/plans/playable-stories-design.md`: record *The Valley of Elah* as accepted in this edition.

## Observable acceptance checks

1. `tests/valley-of-elah.test.ts` covers progressive armor shedding speeds (`82 < 132 < 188 < 256`), armor/brook soft boundaries, out-of-order stone picking, 30/120 Hz approach determinism (`< 1e-6`), untimed sling persistence & release, full valley roaming & verse cycling, replay reset, and short Safari landscape headroom with overhead sling arc.
2. `tests/a11y-runner.test.ts`, `tests/scripture-study-catalog.test.ts`, `tests/sitemap.test.ts`, and all existing unit & smoke suites pass.
3. `tests/e2e/playable-stories-navigation.spec.ts` verifies the updated hub (including no-JS at 320 px with `Enter the Valley of Elah`), full Valley of Elah keyboard/button playthrough + replay, and no-JS 1 Samuel 17 reading.
4. Live desktop, mobile portrait, and short mobile landscape screenshots inspected visually across all phases, plus Axe WCAG 2.2 AA (0 violations in light & dark schemes) and full production release verification.
