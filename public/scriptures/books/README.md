# Scripture book briefings

These files are hand-authored orientation, not generated chapter summaries. A
briefing must tell a first-time reader what kind of book they have, how its
language actually works, where the English came from, where traditions differ,
and which claims remain debated.

## Language-context standard

Do not copy a New Testament Greek word-study template into every book.

Every briefing must separate:

1. **Composition** — the language(s) and register of the literary work.
2. **Story world** — languages spoken or invoked inside the narrated setting.
3. **Textual history** — partial-language sections, ancient translations,
   recensions, manuscript additions, and the form that became canonical.
4. **Hosted English** — the exact edition measured and what its wording can or
   cannot prove about the source text.

Each `textualHistory` layer, language `feature`, and original-language `example`
has `sourceIds`. Every id must resolve to a stable entry in `sources`. Verse
references must resolve in at least one hosted text for that book.

The language section needs at least four meaningful features. A feature is not
just a gloss. It explains:

- what recurs;
- how it sounds or structures thought;
- what an English translation can hide;
- what conclusion the evidence does **not** justify; and
- where a reader can see it in the hosted text.

Mark's `euthys` treatment is the depth benchmark: frequency alone is
insufficient; temporal force, discourse function, register, translation
variation, and cautions all belong together.

## Calibrate by literary and textual family

The first ten briefings intentionally cover different failure modes:

| Calibration book | What it tests |
| --- | --- |
| Genesis | Hebrew narrative, name-play, repeated headings, Septuagint reception |
| Psalms | Hebrew poetry, parallelism, acrostics, performance, Greek numbering |
| Daniel | Hebrew–Aramaic spans, apocalypse, Greek additions, canon-dependent scope |
| Mark | Vernacular Koine pace, Aramaic forms, translation smoothing |
| Matthew | Ordered Koine, five discourse seams, fulfillment formulas, intra-Jewish polemic |
| Luke | Register-switching Koine, Septuagintal cadence, journey design, salvation vocabulary |
| Acts | Speech-shaped historiography, multilingual mission, word-growth summaries, unusually fluid textual transmission |
| John | simple Greek with layered ambiguity, narrator glosses, a mobile passage |
| Romans | dictated letter, diatribe, semantic debates, Greek Scripture in argument |
| Sirach | Hebrew original, ancient authorial translation, recovered witnesses, recensions |

New books should be compared with the nearest calibration case, then adjusted
for their own evidence. Prophecy needs oracle form and poetic rhetoric; legal
collections need casuistic/apodictic forms and technical vocabulary; epistles
need letter production and oral delivery; wider-canon books need their actual
Hebrew, Aramaic, Greek, Latin, Syriac, Ge'ez, or Armenian transmission history.

## Rollout

Ship in small, reviewed batches rather than mass-producing 84 generic files:

1. Torah and Former Prophets
2. Hebrew poetry and wisdom
3. Major and Minor Prophets
4. Gospels and Acts
5. Pauline and General Letters
6. Catholic and Orthodox deuterocanon
7. Ethiopian, Armenian, and wider Orthodox books represented by hosted texts

A batch is complete only when tests confirm:

- the shape covers every canonical chapter slot once;
- every local reference exists in a hosted edition;
- every language claim resolves its sources;
- the rendered page exposes composition and transmission instead of one flat
  ‘original language’ label; and
- a human review has checked that debates are proportionate, claims are not
  invented, and tradition-specific chapter/verse differences are explicit.

Chapter guides should link back to this book-level context and add only the
language features materially active in that chapter. They should not repeat the
entire briefing 1,428 times.
