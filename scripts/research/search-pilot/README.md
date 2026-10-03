# Find search benchmark

This is separate from the 200 relationship/support cases in `../pilot/`.
`queries.json` contains **100 draft queries** in five equally sized families:
lookup, feelings, paraphrase, competing evidence, and difficult/no-answer cases.
Each pair stays in one query group. There are 50 development and 50 held-out
queries. Editors must audit related source passages and refine the grouping
before the split is considered validated. `general-text.txt` is an original
evaluation fixture, not a historical source.

```sh
npm run research:find:benchmark -- collect
npm run research:find:benchmark -- packet
npm run research:find:benchmark -- score
```

These commands make **no Jev requests**. Collection compares the corrected
baseline with an experimental adjacent-verse word channel. Both collect up to
200 distinct candidates. Normal Find still displays 20 and keeps its existing
ranking. Passing a benchmark pool directly to Jev is rejected.

Outputs are ignored under `.research/search-benchmark/`. Collection resumes
existing observations; `--refresh` replaces them deliberately. `--count=2`
runs a small development smoke check. The default review packet pools the top
20 from each variant; `packet --all-candidates` includes the broader retrieval
pool for inspecting missing sources. Add reviewer-nominated passages before
scoring; do not restrict relevant targets to whatever a system returned.

Two independent reviewers each assign a grade: 0 unrelated, 1 indirect theme,
2 relevant, 3 directly relevant. They must preserve the passage ID and source
hash and supply their identity, ISO date, and notes. A single judgment does not
count. Put completed records in `.research/search-benchmark/reviews.json`:

```json
{
  "reviews": [],
  "adjudications": []
}
```

Each review has `queryId`, `passageId`, `sourceHash`, `grade`, `reviewer`, `date`,
and `notes`. A disagreement additionally needs an adjudication with those
fields and `reviewers: ["first reviewer", "second reviewer"]`. Names must match
the independent reviews. No labels or editorial decisions are supplied by the
generator. Missing or stale labels remain unreviewed, never correct by default.

The scorer reports review coverage, precision@5, graded nDCG@10, nominated-target
coverage within 200, latency, and retrieval issues per query and variant.
Precision@5 counts missing positions as zero. nDCG uses the adjudicated pool;
it is undefined when that pool has no positive gain. Unreviewed top results
leave the corresponding score unavailable. Candidate coverage is relative to
the nominated/adjudicated targets, not exhaustive recall across the corpus.

After the complete development top-20 pools have been reviewed, `freeze`
records the manifest, configuration and review hashes. Held-out collection is
blocked until then. `collect --split=held-out` refuses changed frozen inputs.
Positive reviewed passages crossing splits are rejected by the scorer. Editors
must also audit neighboring/near-duplicate passages; exact-ID checks alone
cannot establish absence of leakage.

The harness does **not** declare adoption. A later comparison must add Jev on
the identical selected pool, report paired uncertainty and per-family outcomes,
and apply the previously specified retrieval and relationship/support gates.
On 2026-09-24, 100 development observations (50 queries × two variants) were
collected without retrieval issues. Their top-20 union contained 1,160 ungraded
query/passage records. No independent labels were available; quality results
therefore remained incomplete. The held-out collection guard was checked and
refused to run.
