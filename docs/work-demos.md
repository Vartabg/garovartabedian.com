# Three demos for the $100 total package

`/work#starter-menu` links to a fictional bookkeeping landing page at
`/work/landing-page`, the client-work spreadsheet handler at
`/work/excel-handler`, and the existing mobile job report at `/work/job-report`.
All three customized deliverables cost **$100 USD total, once, for one business**.
The examples demonstrate bounded starter scopes, not client engagements.

## Landing page

Good Measure is a fictional independent bookkeeper for freelancers and small
service businesses. Original SVG artwork, route CSS and self-hosted type give
it its own identity. The page is server-rendered; only the four-choice inquiry
preview hydrates. Native required selects produce editable-by-choice text;
copy failures offer manual selection. Editing or resetting invalidates the
preview. Nothing is booked, sent or persisted. The real package email link
comes from the shared portfolio content and includes none of the demo choices.

The business choice is an editorial recommendation, not an industry ranking.
[NFIB's 2025 member survey](https://www.nfib.com/wp-content/uploads/2025/06/2025-NFIB-Technology-Survey.pdf)
found that 75% of responding firms with 1–9 employees had a website. It supports
focusing on very small businesses, but does not establish that bookkeepers
have the largest website gap.

## Excel handler

A dedicated module worker opens real XLSX or strict UTF-8 CSV files, accepts
four column mappings (date, client, service, USD amount), normalizes whitespace,
checks dates and exact cents, and groups Ready rows by Monday-starting week
and service. US slash dates require an explicit option. An Excel date cell that
carries a time keeps its day; the time of day is not part of the summary. Extra duplicates are
retained by default; an explicit option moves them to review. Invalid and
mapped-formula rows are excluded from totals with reasons.

The source, normalized rows and export remain in the open page/worker. There
is no server endpoint, account, storage or file-content analytics. Clearing,
unmounting, timeout or replacing a file terminates the worker; request IDs and
worker identity reject stale results and file-read failures. Changing mapping,
sheet or options invalidates the displayed result and export. A 15-second
operation deadline offers cancellation, not simulated progress.

The workbook keeps Ready, Needs review, Original data, Summary and Read me
sheets. Text cells, including formula expressions and formula-like customer
names, remain literal text; formulas, macros and external links are not copied
as executable objects. Originals include blank and review rows. Summary totals
cover Ready rows only; this is record cleanup, not bank reconciliation.

Limits: 5 MiB input, 8 worksheets, 50 columns, 10,000 data rows per worksheet,
20,000 total data rows, 2,000 characters per cell, and bounded ZIP expansion.
The worker validates XLSX container records and bounded decompression before
SheetJS parses the workbook. Unsupported/encrypted/macro-enabled archives are
rejected. ZIP archive comments are rejected to keep the validator and SheetJS
parser aligned. CSV parsing does not use HTML auto-detection. The fictional
sample uses the same import/processing/export pipeline as an uploaded file.

A worksheet the demo cannot map is listed and left out instead of rejecting the
file, so an ordinary workbook still opens when it carries a blank tab, a notes
tab narrower than four columns, or an Excel error cell. The file is rejected only
when no worksheet is left. Width comes from the columns that actually hold a name
or a value, so a trailing formatted-but-empty column and a stray CSV separator
are not columns; a column with no name in row 1 is listed by its position, while
a row 1 with no names at all is still rejected.

## Current stable stack

Next.js 16.4.2, React/React DOM 19.3.1, Node 24, TypeScript, native CSS,
self-hosted fonts and browser module workers. Turbopack remains the default.
The old Next 15.5.26 postinstall image-response patch is removed because the
upstream fix is present; the disconnect regression test remains. Next's new
React lint recommendations remain strict for all new files; exact existing
legacy findings are visible warnings pending separate refactoring. Existing
hooks/dependency rules remain active.

Next 16 also began discovering the dormant root middleware. The previous
Next 15 build manifest had no middleware; live production used the policy in
next.config.ts. The dormant middleware applied per-request nonce/strict-dynamic
headers to prerendered HTML with no nonce attributes, blocking hydration in
production browser checks. It is removed, retaining the existing production
static-friendly policy, restricted origins and essay-only framing/isolation
exception. The header test now exercises the configured headers that are
actually served. A future nonce policy would require deliberate dynamic
rendering or a separately designed static integrity policy; this task does not
claim that the existing inline-script allowance has been eliminated.

Turbopack also emits separate API and RSC copies of the writing-search module.
The server now shares production catalog/index initialization promises by
checkout directory, schema and resource. Failed loads evict only their own
promise; development remains module-local for reloads. This avoids duplicate
reads/tokenization within a Node process without changing search results or
sharing request data. Separate serverless processes still initialize separately.

Two existing evidence loaders now read their two approved source artifacts
through literal paths. A dynamic path joined to the project root made Turbopack
trace the whole checkout, including local test output and compiler caches that
the deployment correctly excludes. The postbuild investigation trace check
requires both source files and rejects those local development inputs before
an upload can begin; source hash verification remains in place.

The lockfile updates source-map-js to its patched 1.2.2 release. The production
audit has no high or critical findings, but still reports five moderate
entries for the existing Node semantic-search dependency chain
(transformers → onnxruntime-node → global-agent → roarr → sprintf-js). The
[unbounded formatting advisory](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)
has no sprintf-js patch; this chain is outside the browser spreadsheet worker.
It is not represented as a clean audit or bypassed by an audit exception.

SheetJS CE 0.20.3 is installed from its official, lockfile-pinned tarball;
`npm xlsx` is obsolete. No runtime CDN fetch is required. SheetJS is Apache-2.0;
fflate 0.8.3 is MIT. Their license files are distributed with their installed
packages. [Official installation guidance](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/),
[worker guidance](https://docs.sheetjs.com/docs/demos/bigdata/worker/),
[Next.js 16.4](https://nextjs.org/blog/next-16-4).

## Verification

Pure-model tests cover strict dates, integer cents, duplicates, conservation
and summaries. Workbook tests exercise real parsing/export and container
rejections. Browser tests cover both demos on desktop and phone, real file
imports and downloaded XLSX contents, configuration invalidation, keyboard
controls, narrow layouts and accessibility. Both routes join the existing
light/dark Axe and Lighthouse release gates. Full source checks and the normal
production release remain required; no release gates are bypassed. The full
browser suite exercises an enabled research UI fixture, so local verification
builds use `FIND_PUBLIC_ENABLED=1`; those assessment calls are mocked. This does
not change the production flag. The release pulls the project's existing
production configuration. The before-hydration test blocks JavaScript while
allowing Turbopack's colocated CSS, retaining its original appearance assertions.
