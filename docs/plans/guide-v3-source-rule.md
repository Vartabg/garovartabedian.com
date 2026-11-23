# Plan: the source rule in guide-v3, and binding Mark

- **Revision:** 2 (2026-11-23). Revision 2 follows the independent review of
  revision 1.
- **Source baseline:** `master` at `930c5337`
- **Branch:** `codex/mark-bind-v3`
- **Builds on:** `docs/plans/guide-rubric-v3-mark.md` (revision 3), which
  added guide-v3 and left Mark unbound.
- **Review record:** `docs/plans/guide-v3-source-rule-review.md`

## Goal

Bind Mark's 16 chapter guides to guide-v3, so the public record shows them
as current, without the rubric saying something the guides do not do.

Today the rubric says: "If a Hebrew or Greek claim is not in the supplied
briefing, leave it out." After the source check of 2026-11-21 and the
second pass of 2026-11-23, Mark carries language and background claims that
rest on Josephus, the Mishnah or a lexicon. The Mark briefing does not
carry them. Bound as the rubric stands, Mark would break its own rubric.

Garo ruled on 2026-11-23 between three ways to settle this (every claim
into the briefing; a source record; a source list under each answer) and
chose the source record.

## Decisions

### 1. The rule (text of `GUIDE_RUBRIC_V3.md`)

In "Grounding", the last bullet becomes two, and a short section follows:

- A Hebrew, Greek, Aramaic or Latin claim that is not in the briefing is
  left out.
- A claim about history, law, custom or geography that is in neither the
  hosted text nor the briefing is left out.
- **Claims kept at review.** Those two rules bind a draft. A reviewer may
  keep or add such a claim only when the book's source check record names
  what it rests on. The record is
  `docs/reviews/<date>-<book name, lower case>-source-check.json`. It is not
  in the grounding, so a drafter cannot use it.
- A kept claim carries its source in the record. Naming the source in the
  sentence is encouraged where it helps the reader, not required. Garo chose
  a record over a source list under each answer.
- No machine check ties a sentence to the record; coverage is the
  reviewer's judgment, and the record states what the review did not read.

In "Voice and interpretive restraint", the bullet on naming disagreement
gains one sentence: where one reading is given alone, say it is a reading.
The line on "the Hebrew literally means" now reads "unsupported by the
grounding or the book's source check record".

### 1a. A last sweep of Mark before the stamp

The first source check covered the places two readers flagged and every
language sentence. It did not look at every background claim. Before the
stamp, one fresh reader lists every remaining sentence that states a fact
about history, law, custom, geography or language that neither the hosted
text, the briefing nor a record supplies. Each is then sourced, or cut back
to what the text says, and listed for Garo before commit.

### 2. No new machine check

The validator cannot tell a background claim from any other sentence, so
this change adds no check and claims none. The rubric says so in its own
text. The public "Guide checks" record lists only machine results and is
not changed by this rule.

### 3. The rubric text is part of each guide's lock

`buildGuidePrompt` reads the rubric file into the prompt, and
`generation.promptHash` is the hash of that prompt. No guide is bound to
guide-v3 today, so changing the file moves no stored hash. The 560 guides
on guide-v2 read `GUIDE_RUBRIC_V2.md`, which is not touched. The lock also
covers the Mark briefing, the cross-references, the topical matches, the
hosted text and the frozen exemplar. After Mark is
bound, a change to `GUIDE_RUBRIC_V3.md` or to any of those will fail the
source lock
for all 16 Mark guides until they are reviewed and bound again. That is the
intended behaviour, and it is the reason the rule is settled before the
stamp.

### 4. Changes to Mark's text

All listed in `docs/reviews/2026-11-23-mark-source-check.md` and approved by
Garo: 36 wording edits, `verses` on 10 glossary entries, and a five-term
glossary for chapter 14, plus whatever the sweep in decision 1a adds.

### 5. The stamp

As decision 7 of the earlier plan:

```
node scripts/scriptures/stamp-guide-review.mjs --status agent-reviewed \
  --reviewer "<reviewer label>" --books MRK --rubric guide-v3 \
  --bind-hand-authored --attributed-model "<drafter label>" \
  --generated-at 2026-08-04T15:51:37.000Z --grounding-bundle-reviewed
```

`generatedAt` is the commit time of `a657d4b6`, when the drafts were
written, not the day of binding. The two labels are Garo's call.
`--grounding-bundle-reviewed` is asserted by the lead after reading the
prepared prompt for Mark under the amended rubric.

### 6. Generated files

`public/meta/guide-record.json`, `public/meta/corpus-health.json` and
`public/meta/site-xray.json` are rebuilt by their scripts, not edited.

## Failure behaviour

- If any Mark guide fails guide-v3 after the edits, the stamp tool refuses
  it and nothing is bound.
- If a guide-v2 hash moves, the guide record test fails and the change does
  not ship.

## Acceptance checks

1. `git diff --stat origin/master -- public/scriptures/guides` lists only
   `MRK/`.
2. All 16 Mark guides pass `validateGuideV2` under their own version with no
   failures, and each stored `promptHash` equals
   `prepareTarget("MRK", n, { rubricVersion: "guide-v3" }).promptHash`.
3. Every guide-v2 guide keeps its stored hash (the guide record test).
4. `public/meta/guide-record.json` shows 16 rows on guide-v3, and the
   current total rises by 16 (576 current, 181 earlier, 829 none, if no
   other guide changed since the earlier plan).
4a. Both dated source check records for Mark, and this plan's review
   record, are committed.
5. `npm run lint`, `npm run typecheck`, `npm run test` and `npm run build`
   pass with no generated-file drift after the build.
6. Browser: a Mark chapter page shows the provenance sentence and the new
   chapter 14 glossary; the case study record shows Mark as current.

## Out of scope

- Reader-facing source lists under each answer.
- Rendering glossary `verses` on the chapter page.
- Drafting any other book under guide-v3.
