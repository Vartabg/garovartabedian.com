# Angels & Demons — The Arc (past → present → future) — Plan

Baseline: `garovartabedian` @ `6499ef8e` (master, clean). Date: 2026-11-09.
Status: pre-implementation. Independent EGM review required before build.

## Concept brief

- **Who it is for:** a reader who meets angels and demons as scattered episodes
  and wants the whole story they belong to — what happened, what is happening,
  and what will happen — without having to trust an unseen synthesis.
- **What they should be able to do / discover:** follow one chronological
  spine through the existing world, retell the arc, and say at each stop
  whether the text states it, an editor connects it, a reading is disputed,
  or a later tradition supplies it. The centre stays where the site already
  puts it: the authority of Christ, and an adversary whose end is defeat,
  not an equal rival.
- **Action → result:** scroll / step era by era on `/angels`. Each era gives
  2–3 anchored passages in the hosted text (WEB), its existing evidence
  grade, and a deep link into the room that already proves it (fall,
  encounters, demons, vocabulary, order). Result: the taxonomy (order ladder)
  is now read as one moment inside a story, not as the story itself.
- **Accepted (owner, 2026-11-09):** spine on the Angels home, not a new room;
  the present era is text-grounded and labelled, no unmarked tradition;
  smallest inspectable proof first, polish after it is checked.
- **Rejected:** new `/angels/history` room; present era filled from later
  church tradition; full polished build in one pass.
- **Decided for the proof:** era titles as in the eras table below; spine sits
  after `StartHere`, before the order ladder. Final visual polish is deferred
  past the proof (not a placement question).

## Goal

Add a server-rendered chronological spine — "The whole story" — to
`/angels` that reuses only records the world already publishes, so a reader
can trace angels and demons from creation to the end, with the church age
("now") present but honestly labelled.

## Scope (proof)

In scope:

1. New typed data module `src/lib/angels/arc.ts`: 6 eras, each
   `{ id, when, title, claim, claimEvidence, stops[] }`. A stop references an
   existing record by key (fall step id, encounter ref, exorcism ref,
   teaching id, or order band id) plus a one-line `note`. No new scripture
   quotes are authored: quotes and citations resolve from the source record.
   Badges are inherited only where the source record carries one: fall steps
   and order bands have `evidence`; teaching and encounter records do not
   (verified in `types.ts`), so those stops render no badge — the era
   framing badge covers the editorial synthesis. Record keys are plain
   strings at baseline (no literal unions, JSON loaded via `as` casts), so
   key safety rests entirely on the unit test in (5), not on `tsc`.
2. New server component `src/app/angels/ArcSpine.tsx` rendering the eras in
   order on the Angels home. Reuse `EvidenceNote` / `EvidenceLegend` grades
   from `src/lib/evidence/claims.ts` (single source of grade wording) and the
   existing `parseRef`/`traditionFor` reader-link pattern from `Descent.tsx`.
3. Placement on `AngelsHome.tsx`: after `StartHere`, before the order ladder
   (`#order-ladder`). One `<h2>`, no new `<h1>` (the page's single h1 lives
   in `WorldHomeHero`; acceptance check 3 asserts one h1 at render).
4. Minimal CSS in an existing angels stylesheet (follow `angels-atlas.css`
   patterns): a vertical spine with era markers. No new images, no new
   client JavaScript, fully readable with JavaScript disabled.
5. Unit test `tests/angels-arc.test.ts`: (a) era ids appear in the fixed
   story-order sequence (see chronology convention below); (b) every stop
   key resolves to a real record in `public/angels/{fall,encounters,
   teaching,order}.json`; (c) fall/order stops surface the source record's
   evidence status verbatim (no grade laundering — Isaiah 14 stays
   `disputed`); (d) `arc.ts` assigns no grade field to any stop (grades live
   only on source records and on era framing); (e) era 5 ("now") framing is
   `inferred` and no era-5 stop presents an Acts record as a present-day
   claim; (f) deep links use the existing anchor formats (below).

Out of scope for the proof: new art/plates, new stories, new dossier
presets, changes to the six rooms, world-registry/homepage changes, SEO
copy changes beyond the section heading. Polish, era-title final wording,
and ladder placement swap are a reviewed second pass.

## Proposed eras and anchors (keys verified against data at baseline)

Chronology convention: era order is story-order (creation → rebellion →
Israel → Christ → church age → end). Stops within an era are thematic, not a
claim about canonical chronology (e.g. Rev 12 sits in era 2 as the rebellion's
fullest picture, explicitly framed as such). The test asserts the era id
sequence, not dates.

| # | Era (`when`) | Anchor stops (existing records) | Strongest grade |
|---|---|---|---|
| 1 | "Before history" — **The throne** | band `throne-seraphim` (Isa 6, Rev 4); band `cherubim`; teaching `col-1-16` | badge on band stops only |
| 2 | "The rebellion" — **The fall** | fall `gen-6-1-4` (disputed), `isa-14-12-15` (disputed), `ezk-28-12-17` (disputed), `rev-12-7-9` (explicit, framed as the fullest picture, not the earliest text) | per-stop badges from fall.json |
| 3 | "Israel's story" — **Encounters before Christ** | `GEN 28:12`, `2KI 6:17`, `DAN 10:4-14`; fall `job-1-6-12` | badge on the fall stop only |
| 4 | "Christ" — **Confrontation and triumph** | `LUK 1:26-38`, exorcism `MRK 5:1-20`, fall `jhn-12-31`, teaching `col-2-15`, `MAT 28:2-7` | badge on the fall stop only |
| 5 | "Now" — **The church age** | teaching `eph-6-12`, `1jn-4-1`, `heb-13-2`, `mat-18-10`; `ACT 16:16-18` framed strictly as "in the Acts record" history | framing `inferred`; no stop badges |
| 6 | "The end" — **The end of the adversary** | fall `rev-20-abyss-end` (binding, Rev 20:1-3); band `lake-of-fire` (Mat 25:41, Rev 20:10); teaching `1co-6-3`, `1pe-3-22` | badges on fall/band stops; era note: text speaks of the end as certain, timing unresolved |

Era framing lines are editorial synthesis: each era shows one `EvidenceNote`
for its framing claim, graded honestly (era 5 framing = `inferred`; era 2
framing = `disputed` is wrong — framing says "the passages are scattered and
their joining is interpretive", graded `inferred`, while the disputed stops
keep their own `disputed` badges).

## Contracts and data flow

- `page.tsx` already loads order/fall/encounters/demons/lexicon/teaching
  server-side; `ArcSpine` receives the same loaded records as props (no new
  fetch, no client fetch). `getFall()`, `getEncounters()`, `getTeaching()`,
  `getAngelsOrder()` signatures unchanged.
- `arc.ts` holds only keys + editorial lines; it never duplicates a quote or
  grade. Resolution is a function returning a resolved stop or `null`; the
  component skips a `null` stop entirely (no placeholder, no invented text).
  The unit test asserts every shipped key resolves, so the `null` path is
  defensive only. (This replaces an earlier draft's `Descent.tsx` fallback
  analogy: a missing arc key has no ref to fall back to.)
- No change to `src/lib/angels/types.ts` public contracts except adding
  `ArcEra`/`ArcStop` types in `arc.ts` itself.
- Anchors (verified at baseline): fall `/angels/fall#<step-id>` (FallRoom
  renders `id={s.id}`); encounters `/angels/encounters#enc-<REF>` where the
  slug replaces non-alphanumerics with `-` (`EncountersRoom.tsx`: `enc-` +
  ref, e.g. `enc-GEN-28-12`); order bands same-page `#band-<id>`
  (`Descent.tsx`). `ArcSpine` deep-links each stop to its room anchor and,
  where a reader ref exists, to `/scriptures/...` via `parseRef` +
  `traditionFor` imported from `@/lib/scriptures/server` (as in Descent).

## Failure behaviour

- Missing/renamed source key: test failure before ship; runtime fallback is
  plain text, never a crash or a fabricated quote.
- A stop whose source record has no evidence field (encounters/teachings):
  no badge is invented; the era framing badge covers the synthesis and the
  stop links to its room where the record lives.
- Proof must not regress: world-registry test (one h1, hero contract),
  angels evidence/lexicon/quotes tests, `tsc --noEmit`, and all 10 angels
  routes returning 200.

## Acceptance checks (observable)

1. `npx tsx --test tests/angels-arc.test.ts tests/angels-evidence.test.ts
   tests/angels-lexicon.test.ts tests/angels-quotes.test.ts
   tests/world-registry.test.ts` — all pass.
2. `npx tsc --noEmit` and `npx eslint src/app/angels src/lib/angels` — clean.
3. Rendered `/angels` (dev server): contains the six era titles in order,
   one h1, every era deep link resolves (fall/encounters hrefs return 200),
   readable with no client JS (server HTML contains all era text).
4. Manual read: no present-era sentence asserts a current-day claim without
   a label; no disputed passage (Isa 14, Ezek 28, Gen 6) is presented as a
   settled biography of Satan.

## Risks / open questions for the reviewer

1. **Theological overreach in era framing:** one-line synthesis claims are
   the highest-risk copy on the page. Are the grade assignments above the
   right honesty mechanism, or should framing lines be unbadged plain text?
2. **Six eras vs. the existing four realms:** the ladder is spatial
   (throne→deep), the spine is temporal. Does placing a temporal spine above
   a spatial ladder confuse, or does the copy sufficiently distinguish them?
3. **Present-era anchors:** `ACT 16:16-18` as "continuation" — is any Acts
   stop acceptable under "text-grounded, labelled", or should era 5 use
   epistle teachings only?
4. **Reuse vs. new data file:** keys-in-code (`arc.ts`) vs. a new
   `public/angels/arc.json`. Code is chosen for type-checking against record
   unions; is that consistent with this world's JSON-first pattern?
