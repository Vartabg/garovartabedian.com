# Public Find retrieval: September 2026 diagnostic

This pass changes the search visitors reach through the nav popup and `/scriptures/search`. It preserves the shared reader, source-note interactions, edition-specific source text, and the hosted assessment service. No new paid assessments or provider calls were made. Production publication remains separate from the protected preview.

## Wording and navigation

Complete phrases are verified against the selected edition before the 200-result display cap. Ranking then considers content-word overlap, retained negative words, ordered proximity, and literal wording. Phrase ties prefer shorter verses, then stable corpus order. There are no query-to-verse overrides. Phrase matching folds case, punctuation and diacritics; contraction-equivalent phrases have a separate label. Morphological fallbacks and partial overlap no longer appear under “Exact word matches.”

Negation is retained even where the concordance excludes it as a common word. The original question is never automatically expanded when it contains a recognized negative word. Word presence cannot establish the scope of a negation or whether a passage supports a claim; the interface says so. Missing source verification is explicit and cannot produce a complete-phrase label.

The popup has an edition selector. Search submission, direct references, result links, and chapter-guide links retain the chosen edition. Meaning results remain WEB and Nave topic references remain KJV, independently of the edition selected for wording. A reader return link carries the original query, search edition and text scope separately from the actual source edition. Unavailable editions produce an explanation rather than a substituted translation. The text scope also offers the same query in the hosted early-writing library.

## Retrieval experiment and decision

The existing search-pilot case schema and validator supply 30 development Scripture cases. Eight reported/general diagnostics bring this run to 38 queries. It covers phrase lookup, themes, questions, negation and an unrelated control. It does not score private Explorer output or assume Explorer ranking is superior.

All vectors and references were checked against the published semantic release and source fingerprints. The local, self-hosted encoder was used for query embeddings and cached on disk. No corpus or embeddings were rebuilt.

| Candidate policy | Agreement with full-vector top 20 | Mean books scanned | Mean published verse-index bytes before compression/cache |
|---|---:|---:|---:|
| Previous 48-chapter / 14-book funnel | 546 / 760 | 13.61 | 3.84 MB |
| Broader, 28 distinct books | 666 / 760 | 28 | 6.75 MB |
| Full verified WEB index (selected) | 760 / 760 | 81 | 14.88 MB |

These counts measure **candidate omission relative to vector ranking**, not human relevance, recall, precision or comprehension. Full scanning has 100% agreement by definition. It removes centroid-based exclusions at the cost of a larger first download; the opt-in explains this. Local inference and vector scanning retain cancellation, integrity checks and caching. Failed downloads fail visibly, rather than being described as an exhaustive result. Meaning results are no longer silently removed merely because they also occur somewhere within 200 word results.

A general vocabulary expansion experiment covers 28 concept families, with no fixed verse answers. Automatically embedding appended related words was not selected: for “loneliness,” its leading result became 2 Timothy 3:3, while other results also remained weak. Public meaning search therefore embeds the original question. Readers instead receive visible, optional searches for related wording. The same vocabulary bridges modern terms to named historical topics where those topics contain source references. Literal topic words outrank stems; arbitrary prefix equivalence was removed (peace/peacock and light/lightning).

## Observed examples

| Query | Before, wording | After, wording / next step |
|---|---|---|
| light of the world | Job 18:18 first; John 8:12 sixth | John 9:5, Matthew 5:14, John 8:12 lead; all contain the complete phrase |
| love your enemies | Judges 5:31 first | Luke 6:27, Matthew 5:44, Luke 6:35 lead; all contain the complete phrase |
| not peace but a sword | Matthew 10:34 fifth | Matthew 10:34 first; labeled word overlap, not a verbatim phrase |
| do not be afraid | Genesis 3:10 first | Contraction-equivalent phrases lead; no claim of literal “do not” in those verses |
| loneliness | No word or topic hits | Still no word hits; explicit explanation, Friendship topic references in KJV, related-word choices and optional meaning search |
| God will not abandon me | Psalm 27:9, then weak generic matches | Psalm 27:9 retained first; remaining generic word results are still weak |

The full semantic scan also surfaces Luke 6:27 first for “love your enemies” and Matthew 10:34 first for “not peace but a sword”; both were absent from the legacy top five. Its leading “loneliness” results remain weak. The topical index may include warnings, opposing views, or contexts that do not answer a visitor’s question. Neither topical membership nor vector similarity proves quotation, historical influence, agreement, or support.

The compact [before/after observations](public-find-relevance-2026-09.json) include all 38 cases, candidate-policy counts, source release and implementation hashes. Raw top-200/top-40 observations and cached embeddings remain in the ignored `.research/search-benchmark/public/` directory.

## Limits on quality claims

Zero accepted human labels were used. No independently adjudicated quality score or adoption gate is claimed. The reported “love your enemies” query coincides with the existing held-out `lookup-02` group; that group is now exposed and needs replacement or regrouping before a future untouched held-out evaluation. The 38-query diagnostic set is not a statistically representative sample of visitor needs. No uncertainty interval for real-world accuracy can be inferred from these measurements.

## Reproduce and verify

Run `npm run research:find:public-benchmark -- diagnostic-name` from the repository. It validates the existing case manifest, verifies the indexed edition, uses only local model files and cached query vectors, and writes an ignored diagnostic report. It does not extract labels or call the assessment API. The pre-change baseline was captured at `7d0877c2`, before the public-ranking implementation changed.

Unit checks cover phrase recovery beyond the display cap, contractions and negation, source-edition mismatch, topic-prefix false matches, full-book candidate coverage, and edition-aware return URLs. Browser checks exercise the public popup and results, selected-edition references, 320px layouts, and source-to-search return. Existing reader and source-note suites remain part of release verification. Engineering outcomes are separate from reader feedback.
