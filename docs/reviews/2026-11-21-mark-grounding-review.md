# Mark chapter guides: grounding review, 2026-11-21

**Status: Mark is not bound to a rubric by this review.** The review found
slips against the hosted text and a large set of claims nothing in the
pipeline has checked. This file records what was read, what was verified,
and what is still open.

## What was read

- All 16 Mark chapter guides (`public/scriptures/guides/MRK/`), as they
  stood at `master` `d5362ce1`.
- Each guide was read against its grounding bundle from
  `buildGrounding("MRK", chapter)`: the hosted World English Bible chapter,
  the Mark book briefing, and the cross-reference and topic aids.
- Readers: `muse-wonder-1.0` (through the `muse` CLI) and
  `gemini-4-hydrogen-medium` (through `agy`). Each ran once per chapter with
  the same instructions: report a finding only with the exact guide text and
  the verse or briefing line that shows the problem.
- Lead: Claude Fable 5.2, which wrote the instructions and checked findings
  against the hosted text.
- Raw findings, exactly as returned:
  `2026-11-21-mark-grounding-review.findings.json` (297 findings).

The earlier review of these guides was the 7-pass agent panel of
2026-08-24 (commit `ef77c7d1`). It is the review the chapter pages name
today.

## Counts

| Kind | Findings | Distinct places |
|---|---|---|
| unsupported (a claim the bundle does not back) | 178 | 119 |
| context-mismatch (audience, date, setting against the briefing) | 50 | 35 |
| overreach | 36 | 31 |
| contradiction | 24 | |
| misquote | 5 | |
| wrong-chapter | 4 | |

By the readers' own grading: 74 must-fix, 186 should-fix, 37 notes. The two
readers flagged the same place 89 times.

A finding is a reader's claim. Only the rows in the next table were verified
by the lead.

## Verified against the hosted text (13)

Each was checked by reading the verse in `public/scriptures/text/web/MRK.json`.

| # | Chapter | The guide says | The hosted text |
|---|---|---|---|
| 1 | 3, outline | "People come from five regions" | 3:7-8 names six: Galilee, Judea, Jerusalem, Idumaea, beyond the Jordan, around Tyre and Sidon |
| 2 | 4, outline | verses 33-41 are "The storm" | 33-34 are still about parables; the storm starts at 35 |
| 3 | 7, question 5 | "most modern translations set it off, and this one does too" | the hosted 7:19 keeps "making all foods clean?" inside the quotation |
| 4 | 8, question 4 | "Seven questions in a row, no answers offered" | 8:17-21 has nine questions, and two are answered ("Twelve", "Seven") |
| 5 | 9, question 7 | "this kind comes out only by prayer" | 9:29 as hosted: "by nothing but by prayer and fasting" |
| 6 | 10, question 9 | the list "drops one item": fathers | 10:30 drops two from 10:29: father and wife |
| 7 | 10, question 10 | quotes "and after three days rise again" | 10:34 as hosted: "On the third day he will rise again." |
| 8 | 11, question 7 | Gethsemane is "two chapters later" | it is in chapter 14, three chapters later |
| 9 | 13, glossary | "chosen ones" is "used four times in this chapter" | three times: verses 20, 22, 27 |
| 10 | 14, setting | the places are "all within one night" | 14:1 opens two days before the Passover |
| 11 | 14, question 5 | "he told them to keep doing it" | Mark 14 has no such instruction; it is in Luke 22 and 1 Corinthians 11 |
| 12 | 15, question 3 | Barabbas "actually led an armed uprising" | 15:7: he was bound with insurgents who had committed murder |
| 13 | 16, question 9 | "the last human action in Mark's gospel is a command disobeyed out of fear" | true only if the book ends at 16:8; the hosted chapter runs to verse 20 |

## Not verified

- **Language claims.** 52 findings at 32 places concern a Greek, Hebrew,
  Aramaic or Latin claim (for example what a word "literally" means, or that
  two verses use the same verb). The rubric says to leave such a claim out
  unless the book briefing supplies it. None of these is in the briefing.
  Many are likely standard; none has been checked against the hosted
  original-language text or a lexicon.
- **Background claims.** History, geography and custom stated as fact (a
  shrine at Caesarea Philippi, how fields were sown, what a coin's
  inscription said). Not checked against any source.
- **Context lines.** Most chapters state the audience more firmly than the
  briefing ("Non-Jewish readers" against "Likely Greek-speaking readers
  outside Judea, probably including Gentiles. That is an inference"), and all
  give the date as "Somewhere in the AD 50s–70s" against the briefing's
  "mid-AD 60s to shortly after 70, though earlier dates are defended".
- **Overreach.** Places where a reader judged that one reading is stated as
  settled. Not adjudicated.

## What followed

Garo ruled "Fix all 13" on 2026-11-21, on the table above with a proposed
correction for each row. The lead (Claude Fable 5.2) made the 13 corrections,
one exact replacement each, in the same change as this file. Row 2 also adds
"then how he taught the crowds (33-34)" to the note of the part that now
holds those verses.

Mark's review stamp is unchanged: the pages still name the 7-pass agent
panel and 2026-08-25, the last review of the whole text. The 13 sentences
were corrected after it. Nothing in the "Not verified" list was changed or
resolved; Mark is not locked to a rubric until it is.
