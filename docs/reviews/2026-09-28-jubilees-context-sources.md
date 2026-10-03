# Jubilees context: sources and open review questions

Prepared 2026-09-28 for the [Jubilees book briefing](../../public/scriptures/books/JUB.json). This is a source trail for an editorial draft, **not a record of human approval**. A reviewer should compare the briefing against the hosted text and the linked scholarship before changing its status or reusing its historical claims in chapter guides.

## What the site actually hosts

The reader serves R. H. Charles, *The Apocrypha and Pseudepigrapha of the Old Testament*, volume II (1913), from a CCEL transcription. The briefing links readers to the site's public [Scripture source notes](../../public/scriptures/SOURCES.md), which identify that edition and summarize the wording and verse-boundary review. For maintainers with this checkout, the [pinned source archive notes](../../scripts/scriptures/sources/charles-jubilees-1913/README.md) and [manifest](../../scripts/scriptures/sources/charles-jubilees-1913/manifest.json) record CCEL URLs, checksums, the [1913 printed volume](https://archive.org/details/apocryphapseudep02char), and boundary checks. Those repository files are not assumed to have public GitHub pages. The hosted text has 50 chapters and 1,307 verse slots. The source audit explicitly does **not** claim that every shorter transcription variant has been resolved. A separate [excerpt review](../jubilees-source-review.md) corrected chapter 17–18 quotations; its exact-word result should not be generalized to every chapter.

The hosted English is therefore a specific 1913 translation and transcription, not a direct display of a complete Hebrew manuscript or of a current critical edition. Charles's bracketed Anno Mundi labels, supplied words, punctuation, and archaic idiom remain edition features. The briefing points readers to those features without replacing them with modernized wording.

## Claim checks

| Claim in briefing | Evidence used | Limit to retain |
| --- | --- | --- |
| Jewish composition in the second century BCE; Sinai is the narrative frame | [Endres, Oxford Bibliographies](https://academic.oup.com/reference/62341/reference-article-abstract/554103345); [VanderKam, Cambridge](https://www.cambridge.org/core/books/abs/outside-the-old-testament/book-of-jubilees/3770C6D45B63CAA5E65C6BCE3F74AF92); [VanderKam, Hermeneia translation description](https://www.jstor.org/stable/j.ctv11cvxnk); hosted 1:1–29, 2:1 | No exact year, named human author, or location follows from Moses' role inside the story. A Qumran copy establishes circulation, not composition there. |
| Hebrew composition, fragmentary Hebrew finds, and complete Geʿez survival | [Collins, *New Cambridge History of the Bible*](https://www.cambridge.org/core/books/abs/new-cambridge-history-of-the-bible/apocryphal-old-testament/BA748C701E87424228C1E1E56FE4A08D); [Endres](https://academic.oup.com/reference/62341/reference-article-abstract/554103345); [Ray, *Harvard Theological Review*](https://www.cambridge.org/core/journals/harvard-theological-review/article/abs/calendar-and-dates-in-jubilees-garden-of-eden-story/5B9726D14F0127A0ACB692A0809A371D) | The usual Hebrew → Greek → Geʿez reconstruction is a transmission model; a complete Greek or Hebrew text does not survive. Do not invent a Hebrew lemma from Charles's English. |
| Forty-nine-year jubilees and the 364-day calendar are structural | [VanderKam, Cambridge](https://www.cambridge.org/core/books/abs/outside-the-old-testament/book-of-jubilees/3770C6D45B63CAA5E65C6BCE3F74AF92); [Ray](https://www.cambridge.org/core/journals/harvard-theological-review/article/abs/calendar-and-dates-in-jubilees-garden-of-eden-story/5B9726D14F0127A0ACB692A0809A371D); hosted 6:30–38, 11:1, 50:4 | This is the book's calendrical program. It should not be asserted for all Jews of the period, for Genesis or Exodus, or for current Ethiopian liturgy. |
| Heavenly tablets and pre-Sinai law shape the retelling | [Endres](https://academic.oup.com/reference/62341/reference-article-abstract/554103345); [Werman, *Harvard Theological Review*](https://www.cambridge.org/core/journals/harvard-theological-review/article/abs/jubilees-30-building-a-paradigm-for-the-ban-on-intermarriage/AA6BA9D0CAE193E9DF9BF2599201669C); hosted 4:32, 6:17, 15:25, 16:29, 50:13 | This describes Jubilees' argument. It does not make all of those details statements of Genesis or Exodus. |
| The book had ancient readers and is received in the Ethiopian Orthodox Tewahedo canon | [Collins](https://www.cambridge.org/core/books/abs/new-cambridge-history-of-the-bible/apocryphal-old-testament/BA748C701E87424228C1E1E56FE4A08D); [Ethiopian Orthodox Church's own canon page](https://ethiopianorthodox.org/english/canonical/books.html) | Ancient interest at Qumran and later Ethiopian Christian reception are different historical settings. The site's Charles English shelf is not a complete Ethiopian Bible or a Geʿez edition. |
| A priestly milieu is possible but not identified | [VanderKam, *Anchor Bible Dictionary*](https://cojs.org/jubilees-_book_of-_james_vanderkam-_anchor_bible_dictionary_-ed-_david_noel_freedman-_doubleday-_new_york_1992/); hosted 30–32 | Legal and priestly emphases support an inference, not a recovered author, office, address, or membership roll. |
| The unity or staged growth of the transmitted text remains discussed | [Ray's article and its review of opposing readings](https://www.cambridge.org/core/journals/harvard-theological-review/article/abs/calendar-and-dates-in-jubilees-garden-of-eden-story/5B9726D14F0127A0ACB692A0809A371D) | The briefing records the disagreement briefly; it does not claim that a specific chapter is proven to be a later addition. |

## Independent review queue

1. Read the entire hosted 50-chapter text against the ten section headings. Verify boundaries especially at 23–24, 29–30, 38–39, and 45–46, where an episode and a new movement meet near a chapter edge.
2. Check all `language.features[*].refs`, `language.examples[*].ref`, and `howToRead[*].refs` in the hosted Charles edition. Verse references point to this edition's numbering; the [source archive](../../scripts/scriptures/sources/charles-jubilees-1913/README.md) records a specific uncertainty at 20:9.
3. Check the claims about the Greek intermediary and Geʿez preservation with a current critical introduction if a later edition is added. Do not silently rewrite Charles quotations to match a newer translation.
4. Revisit the concise composition debate with a specialist in Second Temple Judaism. The book's unity, authorial milieu, relation to Qumran, and exact date are not settled by the sources used here.
5. Have a named human reviewer assess theological proportion, canon language, and the presentation of chapter 30's violence before declaring the briefing reviewed. No such review is recorded here.

For chapter-guide drafts, use `JUB.json` as book-level grounding and keep each guide anchored to its own chapter. Do not copy the whole briefing into all 50 guides, and do not treat the listed secondary works as substitutes for reading the hosted passage.

## Reader and validation contract

Each chapter has a short `readingContext.here` orientation before the text and expandable `before` and `after` notes. All references use the hosted Charles numbering and preserve that edition in their links. At the beginning and end of the book, the notes describe the opening and conclusion instead of inventing an adjacent chapter.

`readingContextSource` binds those notes to the complete hosted edition, because changing a neighboring chapter can invalidate a transition. The validator checks the binding, reference bounds and narrative order, and every cited book-source ID. The existing guide-v2 checks still require complete outlines, chapter-specific questions, and quotations matching the hosted text.

This delivery covers Jubilees and provides optional fields for subsequent books. It does not establish that older guides elsewhere in the corpus have received the same contextual or editorial review. For another book, finish its source-backed briefing, author the chapter notes from its own edition, have another reviewer inspect the exact grounding bundles, and record the actual review status before publishing.

## Completed agent editorial pass

Two drafting agents split chapters 1–25 and 26–50, then independently reviewed the other agent's chapters against every hosted verse, neighboring transitions, the book briefing, rubric, and exact `prepareTarget()` grounding bundles. A separate research agent prepared and checked the briefing's sources. The parent agent checked and applied the resulting corrections before binding the records.

The review corrected the ark-exit transition in chapter 6, the chronological return to Sarah's pregnancy in chapter 16, the witness to Jacob's blessing in chapter 19, and a chapter 20 word question about a word absent from that chapter. It also made the circumcision claim about angels and the severity of the Isaac test and blood-for-blood rule more explicit. The reviewing agent rechecked the saved corrections.

All 50 guides were stamped `agent-reviewed` after clearance. The collection includes 363 questions and 125 quotations checked against the hosted Charles text. The provenance uses `review-bound` attribution to Codex agents with the model unmeasured; it does not claim a measured API generation run or human approval. Structural validation is a reference and consistency check, not proof of historical accuracy or a substitute for specialist review.

Compatibility note: the 108 published Enoch guide-v2 hashes attest an older prompt whose introductory sentence mistakenly says WEB despite supplying Charles text. This change preserves that exact historical template for Enoch and its existing records. Jubilees uses CHARLES throughout. Correcting Enoch's prompt requires an explicit, separately reviewed provenance migration before regenerating that batch; the citation-only rebind tool must not be used for it.

## Verification before publication

- Lint, TypeScript, and the production build passed with Node 24.
- The full suite passed: 738 unit tests and 48 smoke tests, including the media audit.
- Seven production-browser tests passed for Jubilees and the existing study reader, including mobile overflow, contextual navigation retaining Charles, the chapter-50 boundary, and accurate review labels.
- All 232 published guide-v2 records validate against their current grounding; the 108 existing Enoch hashes remain unchanged.
- Source-ledger tests passed. Some academic sites refuse automated URL checks; those refusals are recorded separately from missing pages and do not imply that full paywalled articles were read.
