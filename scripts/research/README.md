# Jev local research

An experimental editorial aid for comparing passages, finding candidate connections, and checking **supplied** claims. It does not infer historical borrowing, establish theological agreement, generate commentary, or publish findings to the site. Public allusion and claim formats are unchanged.

## One-time setup

Use the repository's Node 24 runtime and `npm ci`, then:

```sh
npm run research:jev -- setup
npm run research:jev -- status
```

`setup` prompts in your own terminal without echoing the key. It writes a private `0600` file at `~/.config/garovartabedian/jev.env`, outside Git. Every worktree loads it automatically; you do not need to enter the key again. An existing `TYPESAFE_API_KEY` environment variable takes precedence. Never pass the key in command arguments, commit it, or paste it into a research manifest. Run setup again to replace it.

Live runs send selected passage text, neighboring context, edition metadata, and supplied claims to TypeSafe. Retrieval and embeddings run locally. Dry runs and offline runs make no Jev requests. Normal site builds and tests make no Jev requests.

## Private website workspace

With Node 24 active, start the local website from this worktree:

```sh
preview run --cwd "$PWD" --port 3340 -- npm run research:jev:web
```

Open **http://127.0.0.1:3340/scriptures/research**. The Scriptures navigation also links to the workspace during this session. The saved key loads automatically in the local Node process; no key is entered in the browser. `npm run research:jev:web -- --port 3340 --bridge-port 3341` supports explicit alternative ports. The `preview` supervisor is Garo's managed-preview utility; on another machine, run `npm run research:jev:web` in a foreground terminal and stop it with Ctrl-C.

1. Choose a preset or select compare, discover, or check a supplied claim. Use hosted chapter/verse selectors, paste an English excerpt, or choose your own UTF-8 `.txt`/`.md` file.
2. **Preview sources and request count** verifies the exact passages and retrieval coverage without contacting Jev.
3. **Evaluate** sends the displayed units and their context to TypeSafe. **Use cached results only** permits offline replay. Reopen a saved incomplete run to resume unchanged inputs.
4. Inspect both passages, neighboring context, source locations, and the model's label distribution. Enter your own reviewer identity and notes to accept, reject, or defer a completed finding.
5. Download JSON or self-contained HTML reports. **Export approved findings** includes only current explicit approvals; it does not publish anything.

The browser interface limits supplied text to 32,000 characters, each selected source to 30 blocks, and each preview to 120 units including explicit references. Whole-Scripture discovery accepts up to six source blocks. Larger or repeated batches remain available through the CLI. Only one website operation runs at a time, with the existing two-request concurrency and 500-attempt run ceiling. Closing the server interrupts evaluation; completed responses remain cached and unchanged runs can resume.

This workspace is available only through the dedicated development launcher on loopback. It is **absent from production**. The bridge checks its local origin and host, the Next rewrite checks the incoming website host, and mutations require a per-session token. Browser selectors cannot open arbitrary filesystem paths. Supplied file contents are copied into `.research/inputs/`; private runs, review histories, and caches remain in `.research/`. No public visitor upload endpoint or deployed TypeSafe credential is added.

With the preview running, the repeatable Chrome check makes no Jev calls:

```sh
npm run research:jev:web:check
preview stop --port 3340
```

It checks host/origin/session rejection through the actual Next proxy, source previews, file input, escaping, downloads, and mobile layout. It uses an installed Google Chrome via Playwright and saves screenshots under `.research/website-check/`. Against a separately running production preview, use `npm run research:jev:web:check -- --production http://127.0.0.1:3342` to verify that the private page and API are unavailable while Scriptures still renders.

## Start with a preview

```sh
npm run research:jev -- compare --jobs scripts/research/pilot/sample-jobs.json --dry-run --run sample-preview
npm run research:jev -- compare --jobs scripts/research/pilot/sample-jobs.json --run sample-live
```

Open the printed `report.html` path in a browser. The self-contained report includes exact passages, context, source locations, model distributions, deterministic string containment, request counts, and reported token usage. The matching `report.json` is the machine-readable record.

Keep private supplied files in `.research/inputs/` (create the directory when needed). Inputs can also be explicitly selected elsewhere on disk. Their original paths and hashes remain in local reports; do not share reports containing private text. `.research/` is Git-ignored. The checked-in pilot texts are intentionally authored test fixtures, not user uploads.

## Operations

```sh
npm run research:jev -- compare --left early:1clement:16 --right scripture:web:ISA:53:4-6 --dry-run
npm run research:jev -- discover --left early:barnabas:3 --corpus scripture-web --dry-run
npm run research:jev -- discover --left file:.research/inputs/essay.md --target scripture:web:ROM:12 --target file:.research/inputs/source.md --dry-run
npm run research:jev -- check-claim --source scripture:web:JHN:11:35 --claim 'Jesus wept.' --dry-run
```

Remove `--dry-run` to evaluate. Every run prints its ID and report path. Use the same `--run ID` to resume unchanged inputs; successful responses replay from cache. A dry run cannot replace an existing live report. Changed sources, context, model, or rubric require a new run ID and invalidate previous approval. `--offline` permits only valid cached results.

The default is two concurrent requests, a 30-second timeout, two transient retries, and **500 total attempts per run**, including retries and earlier invocations of that run. `--max-attempts N` explicitly sets a new total ceiling when resuming. Evaluation suites also cap new attempts across the invocation. Missing credentials, stale sources, invalid responses, unavailable local models, and exhausted limits remain explicit incomplete outcomes. Authentication failures are not retried. HTTP 429/529 overloads and transient transport/server failures receive bounded backoff.

Token totals are usage reported by the API, not estimates. Caches retain the original result's usage, while replay adds zero new tokens. Attempts without a usable usage response are marked unmetered; the report cannot reconstruct their billing. Benchmark totals count new reported usage during that invocation. Latency includes cache hits.

Exit status: `0` for a successful command/dry run, `1` for invalid arguments or a fatal error, and `2` for an incomplete run or an evaluation that has not passed adoption. A development evaluation normally exits `2`, because it cannot demonstrate held-out adoption.

## Sources and repeatable batches

Selectors:

| Selector | Meaning |
| --- | --- |
| `scripture:web:ISA:53:4-6` | Hosted edition, book, optional chapter and inclusive verse range |
| `early:1clement:16` | Legacy hosted work and optional unique chapter number |
| `library:protoevangelium-james:translator-and-historical-edition-notes` | Published library edition and optional section ID |
| `file:.research/inputs/notes.md` | Explicit UTF-8 `.txt` or `.md` file |

Structured JSON manifests support exact paragraph/block and file character selectors:

```json
[
  {
    "id": "clement-quotation",
    "mode": "compare",
    "left": { "kind": "early", "id": "1clement", "section": 15, "paragraph": 0 },
    "right": { "kind": "scripture", "translation": "web", "book": "ISA", "chapter": 53, "verse": 4, "endVerse": 6 }
  },
  {
    "id": "explicit-claim",
    "mode": "check-claim",
    "claim": "Jesus wept.",
    "source": { "kind": "scripture", "translation": "web", "book": "JHN", "chapter": 11, "verse": 35 }
  },
  {
    "id": "selected-note",
    "mode": "check-claim",
    "claim": "The supplied note supports this exact assertion.",
    "source": { "kind": "file", "path": ".research/inputs/notes.md", "start": 0, "end": 120, "language": "en" }
  }
]
```

Run a manifest with `compare --jobs path.json` (mixed operations are allowed). `section`, `paragraph`, and library `block` indexes are zero-based. Scripture chapters/verses are one-based. File `start`/`end` are zero-based UTF-16 character offsets, with an exclusive end. They must match the actual file; the example `120` is not a default. Non-English files must declare their language; this release skips them as unvalidated. Hosted Scripture here consists of English translations. Legacy early editions are marked `legacy-edition`, not automatically certified primary text.

Each source block stores unchanged decoded text, whole-artifact SHA-256, text SHA-256, its JSON pointer where applicable, offsets, edition, role, and neighboring context. Library primary text, translator commentary, and catalog notes retain their existing block kind. Context labels retain those roles too.

Paragraphs and headings delimit blocks. Oversized blocks use the existing local tokenizer/chunker (384 tokens, 48-token overlap). All selected non-whitespace text is covered. Context windows contain up to 1,500 characters on either side in the same paragraph and up to 1,000 characters from each immediate neighbor. That window is not the entire document. Comparisons produce the cross-product of selected blocks; claims are assessed separately against each selected block, preserving mixed evidence. A compound claim can require `insufficient-context`; no automatic claim extraction or document-wide affirmative verdict is supplied.

Discovery combines the site's Scripture reference parser, lexical ranks, and local embedding ranks using reciprocal rank fusion. It evaluates up to 20 distinct candidate locations per source block, plus explicit references separately, including explicit references outside a restricted target corpus. References support full book names, common site abbreviations, and same-chapter Arabic-number verse ranges. Roman-numeral and cross-chapter references need explicit source selectors. Coverage reports cannot establish exhaustive discovery: omitted candidates remain unevaluated.

Published embeddings are reused only when source fingerprints, content-addressed artifacts, and encoder recipes match. Additional text gets a private `.research/embeddings/` cache using the bundled local encoder. A research run never rebuilds or publishes semantic site assets. Full Scripture discovery can take longer than a small target selection.

## Editorial review and export

Copy a finding ID from the report:

```sh
npm run research:jev -- review --run sample-live --finding FINDING_ID --action accept --reviewer 'Your name' --notes 'Checked both passages and their edition context.'
npm run research:jev -- export --run sample-live
```

Actions are `accept`, `reject`, or `defer`; identity and notes are required. Decisions append to a dated history, retain the original model result, and appear in the HTML report. The latest decision controls export. Rejection and deferral can record problems in incomplete outcomes. Acceptance requires a complete result and unchanged sources. Exports recheck the exact result and source hashes; any stale accepted finding blocks the export until re-reviewed in a new run.

Only explicitly approved findings enter `.research/runs/ID/approved.json`. This is a separate editorial research bundle. Publication is a subsequent reviewed code/content change, never a side effect of this command.

## Evaluation and adoption

See [pilot/README.md](pilot/README.md) for the 200 draft cases, 27 old matcher regressions, adjudication protocol, and limits. The rubrics are versioned in `types.ts`/`client.ts`; `jev-1.13.0` is pinned and a different returned version is rejected. Any model/rubric change needs another benchmark run. Exact substring containment is computed separately and does not prove an allusion.

Passage labels: `close-wording`, `substantial-paraphrase`, `thematic-overlap`, `unrelated`, `insufficient-context`. Claim labels: `directly-supported`, `interpretive-step`, `contradicted`, `not-addressed`, `insufficient-context`. Model confidence and option probabilities describe model uncertainty; they are never a probability that a historical or theological assertion is true.

API contract: [bounded state](https://docs.typesafe.ai/concepts/state), [HTTP API](https://docs.typesafe.ai/api), [models](https://docs.typesafe.ai/models), [confidence](https://docs.typesafe.ai/confidence). Requests use native Node `fetch` directly, one passage pair or claim/context unit per request, with only relevant supplied state. A conservative 24 KB request budget fails explicitly rather than truncating source text.

## Find: Evidence Explorer (local experimental release)

Start the existing private website with `npm run research:jev:web`, then open
`http://127.0.0.1:3340/scriptures/find`. Find's ordinary Enter submission opens this
workspace when the private bridge is enabled. Explicit references still open
the reader; select a suggestion to navigate, or prefix commands with `>` or `/`.
Outside the private preview, ordinary text opens the public Scripture search.

The nav-bar **Find** button (or Cmd/Ctrl+K) opens the quick-search popup. Choose
**Everything**, **Passages & writings**, or **Site pages**. On desktop, hover a
result or use arrow keys to preview it; Scripture previews retain the selected
edition and offer surrounding verses. Click **Search passages** to continue the
query in the workspace, or use **Open full Find workspace** to start there.
The popup itself never calls Jev. Commands remain available from **Commands**
or `?`. Scholarly and preference commands both require an explicit prefix:
`> root love` opens a word study, while `root of all evil` searches that phrase.

Choose Scripture (WEB, KJV, Douay–Rheims, or Brenton), the original early-writing
shelf, both, or supplied UTF-8 text up to 32,000 characters. Supplied files stay
under ignored `.research/inputs/`. The search combines phrase priority,
BM25-style word scoring, full verified WEB verse vectors for WEB searches,
early excerpt vectors, and Nave references for KJV searches. It returns up to
20 distinct candidates with exact source spans. Non-WEB Scripture is searched
lexically in its own edition; WEB vector locations are never transferred to
another edition. Coverage explicitly identifies this limitation. Expanded
library editions are outside the early shelf scan. Source or index failures
remain explicit.

On the public Scripture search page, word matches retain the selected edition,
meaning matches always preview and open WEB, and Nave topic matches always
preview and open KJV. Both supplementary sections label their source edition.
The first browser meaning search downloads about 47 MB of model and runtime
files, plus search data; browser caching can avoid later downloads.

The redesigned workspace separates a compact passage list from the selected
source. Use **Passage**, **Context**, **Connections**, and **Assessment** to
investigate without leaving the search. On a phone, selecting a result opens
the reader; **All passages** returns to the list. Arrow keys move through
results and tabs. Scripture names are expanded from the canon catalog.

**Keep passage** saves a bookmark for this run in this browser. Bookmarks in
the **Kept** filter survive reloads; they are not editorial approvals. **Recent
searches** restores a locally saved run. **Search coverage & saved report**
contains source limitations, request usage, and the JSON download, including
kept passage IDs. Clearing browser storage removes bookmarks, not saved runs.

**Find passages** makes no Jev calls. **Assess relevance** sends the
displayed candidates and context, with at most two concurrent calls, a 30-second
timeout, two transient retries, and a cumulative 500-attempt limit per saved
search. Cached judgments include the query, source/context, rubric, and model.
**Jev relevance groups** sorts direct relevance, indirect relevance, insufficient
context, unrelated, and unassessed passages in that order. A helpfulness
estimate breaks ties within each group, then original search rank. Connection
candidate selection uses the same order. The Assessment tab labels judgments
as unreviewed; model distributions and helpfulness estimates are available in
collapsed details. They are not measured accuracy or probabilities of truth.
**Connections → Explore connections** evaluates the selected passage against four
other shortlist candidates, with up to 12 attempts including retries. It saves
standard research outcomes and links to the existing editorial review and
approved-only export workflow.

Search snapshots and API caches live under ignored `.research/find/` and
`.research/find-cache/`. A downloaded search JSON is an unreviewed research
snapshot, never an approved publication bundle. The same saved private key is
loaded automatically. Normal builds and tests make no live Jev requests.

Run browser verification against the managed private preview:

```sh
npm run research:find:web:check
npm run research:find:web:check -- --live
```

The default check covers retrieval, navigation, editions, early writings,
supplied text, escaping, and phone layout with no Jev calls. The explicit
`--live` option also reviews 20 passages and checks four connections; valid
cached replies may reduce requests. Set `FIND_PREVIEW_URL` to use another local
preview port. Screenshots and results go to ignored `.research/find-verification/`.

This release has engineering checks, not an independently adjudicated search
benchmark. See [the audit and evaluation proposal](../../docs/research/find-feature-audit.md).
The [review follow-up](../../docs/research/find-review-followup.md) records the
correctness changes, retrieval diagnostic, and remaining public-release work.

The separate [public job infrastructure](../../docs/research/find-public-jobs.md)
adds hosted-source assessment endpoints, durable jobs, guest isolation and
shared quotas/cost accounting behind disabled deployment controls. It does not
expose the local bridge. The [100-query search pilot](search-pilot/README.md)
collects broader candidate pools for editorial evaluation; its experimental
retrieval settings do not change the normal Find shortlist.
