# Nine book briefings: drafting and source check, 2026-11-24

**Status: applied on 2026-11-24.** Garo ruled on the calls for these nine briefings
that day and took them as recommended. His ruling is the human review that
`public/scriptures/books/README.md` asks of a batch.

Books: 1 Corinthians, 2 Corinthians, 1 Timothy, 2 Timothy, Hebrews, James,
1 Peter, 1 John, Revelation. These were the nine New Testament books with no
briefing. A chapter guide cannot be drafted for a book without one.

## How they were made

1. A measured fact pack per book: chapters, verses and words from the hosted World English Bible, and lemma counts from the hosted SBL Greek.
2. One fresh Claude Opus drafter per book, writing a log of every source it read.
3. A machine check of shape, references, measured size, live links, and every Greek form against the hosted Greek at its verse.
4. Two outside readers per book: muse-wonder-1.0 and gemini-4-hydrogen-medium.
5. One fresh Claude Opus checker per book, which re-fetched every source, ruled on every reader finding, re-measured every count and proposed exact edits.
6. Lead Claude Fable 5.2 read every proposed edit and every fact line, caution and debate, applied the edits, and made the additions listed under leadAdditions.

The full record, with each drafter's source log, both readers' raw findings
and each checker's ledger, is `2026-11-24-nine-briefings-check.json`.

## Counts

| Book | Debates | Cautions | Sources | Reader findings | Edits applied | Claims confirmed |
|---|---|---|---|---|---|---|
| 1 Corinthians | 5 | 6 | 13 | 8 | 18 | 20 |
| 2 Corinthians | 3 | 6 | 17 | 10 | 16 | 24 |
| 1 Timothy | 4 | 7 | 20 | 7 | 26 | 21 |
| 2 Timothy | 3 | 6 | 18 | 9 | 11 | 22 |
| Hebrews | 4 | 6 | 19 | 10 | 21 | 18 |
| James | 2 | 6 | 24 | 8 | 16 | 14 |
| 1 Peter | 3 | 6 | 18 | 4 | 13 | 14 |
| 1 John | 4 | 6 | 19 | 12 | 20 | 13 |
| Revelation | 4 | 7 | 19 | 15 | 23 | 20 |
| **Total** | | | **167** | **83** | **164** | **166** |

No source failed its re-check. Some source descriptions were narrowed to what
the page shows; those changes are in each ledger under `sourceSaysEdits`.

## Rules the briefings were held to

- Nothing is stated as fact unless it is visible in the hosted text or tagged
  Greek, or was read that day in a fetched source.
- A link in `sources` is a page that was fetched and answered 200.
- Counts are measured over the hosted text, never estimated.
- On a contested question the briefing shows the range and names the split:
  what is not in dispute first, then each position with its grounds.
- Where a text has been used to harm people, the caution says what the text
  says and what it does not license.

## Added by the lead after the checkers

- **JAS.** A fourth position in the faith and works debate, the Catholic reading, from the Council of Trent session 6 chapter 10 and canon 9 and Catechism paragraph 1815, both read at the source.
- **1TI.** The reason from creation at 2:13 restored to the first position of the 2:11-15 debate, sourced to the Danvers Statement, read at the source.
- **1TI.** A new caution on 1:9-10, from the hosted editions, the NET notes as the checker reported them, and a survey article read at the source.
- **1TI.** Papyrus 133: both survey dates shown, with the article on the papyrus added as a source.
- **1TI.** The date line reworded to open with the condition, if Paul wrote it.
- **2TI.** Authorship debate: most according to a survey article, to match 1 Timothy.
- **1CO.** One checker edit reworded and its sentences reordered in the continuationist position.

## Follow-ups left open, none blocking

- The Titus briefing says many scholars doubt Pauline authorship of the
  Pastoral Letters where the surveys read say most. Its wording is locked to
  its chapter guides, so it was not changed here.
- The 2 John briefing dates 1 John to about 85 to 95; the 1 John briefing shows
  a later range and the 90s.
- The terms Koine and lemma are explained in some briefings and not others.

## Limits

- No scholar's own book was read. Named modern scholars are known through the NET Bible notes, Early Christian Writings or a survey article, and the sentences say so.
- Ancient writers were read in old public-domain English, not in Greek or Latin.
- Manuscripts were not viewed. Dates and contents come from the NET notes and survey articles.
- Each checker was one pass. A claim below its bar may remain.
- bible.usccb.org refused automated readers on the day, so nothing cites it.
- The lead's additions were not read by an independent checker.
- The lead read the language sections only through the checkers' ledgers and the machine check.
