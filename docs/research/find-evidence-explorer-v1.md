# Find: Evidence Explorer — first local release

The private research website now has a unified Find results view at
/scriptures/find. Ordinary Enter submission starts a search consistently,
explicit references retain direct navigation, all commands require a
prefix, and reader links preserve the selected edition.

The local engine combines phrase priority, BM25-style word weighting, full
verified WEB verse embeddings for WEB searches, early-writing excerpt embeddings,
and Nave references for KJV searches. Other Scripture editions use their own
word and phrase search; WEB vector locations are not transferred between
editions. It scans all 38,029 indexed WEB verses instead of limiting the
candidate pool to 14 books. The early shelf has 887 indexed excerpts; expanded
library editions are outside this release. Supplied UTF-8 text is split with
the existing boundary/token-aware source adapter and indexed privately.

Results expose source text, neighboring context, edition/role, location and
hashes, retrieval channels, coverage, and errors. Users can review the 20
candidates with Jev, compare the original and model ordering, save a local
research snapshot, and reopen saved searches.

Selecting a passage can evaluate up to four connections from that shortlist.
The resulting relationship tree exposes both passages and the original model
judgments. Its findings enter the existing editorial review and approved-only
export workflow. Relevance does not establish support; textual relationships
do not establish historical influence or theological agreement.

## Find workspace redesign

Find now opens with a focused search entry and examples for feelings, ideas,
and exact words. Source and edition choices stay beside the query. The global
Find dialog offers an explicit **Search passages** action separately from its
navigation suggestions, plus a direct link into the local workspace.

Results use a compact list and a selected-passage reader. **Passage**, **Context**,
**Connections**, and **Assessment** keep the source and the question together.
Context references use readable book names while the underlying source text,
hashes, offsets, and model request remain unchanged. Connections display inside
the reader, with a handoff to editorial review and approved-only export.

**Keep passage** persists per-run bookmarks in browser storage and adds their
IDs to the downloaded research snapshot. It is explicitly separate from
approval. **Recent searches** restores runs, and coverage/usage/provenance stay
available in expandable details. On phones, the result list and reader form
separate views with an explicit back control. Keyboard users can move through
results and tabs with arrow keys.

The redesign verification covered repeated searches from the global overlay
while the workspace was mounted, edition links, saved bookmarks, phrase filters,
context, early writings, supplied-text escaping, source-error recovery, saved
Jev and connection replay, and mobile reading/back navigation. No new provider
requests were made. The existing Find browser suite passed 9 desktop and 10
phone cases (one phone-only test is intentionally skipped on desktop).
Automated accessibility checks found no WCAG A/AA violations in the workspace's
four reader tabs at 1440- and 390-pixel widths. This is a bounded automated
check, not a complete accessibility audit.

## Navigation popup

The nav-bar **Find** button and Cmd/Ctrl+K open a redesigned popup for quick
text search and site navigation. Filters separate **Everything**, **Passages &
writings**, and **Site pages**. The opening view shows a few query examples,
recent/current places, and bounded destinations; the long command directory
is available through **Commands**. Ordinary text has an explicit full-search
action, while selecting a destination opens that page.

On desktop, hover or arrow-key selection previews a result. Scripture previews
load the actual selected edition and show the selected verse, with optional
neighboring verses. Chapter-only previews are labeled as opening excerpts.
A failed preview remains explicit and leaves the source-opening action usable.
The phone popup uses a compact single-column list with verse snippets. No Jev
request is made by opening, typing in, or navigating the popup.

Reader variant updates now preserve the verse hash and Next history state;
opening KJV John 11:35 no longer loses the verse anchor while the edition loads.
Added tests cover scope filtering, destination deduplication, bounded opening
results, edition resolution, invalid source URLs, popup preview/context,
keyboard submission, and preview failure. The popup browser suite passed 25
cases across desktop and phone, with three viewport-specific cases skipped.
Automated accessibility checks found no WCAG A/AA violations in the empty,
source-preview, and mobile popup states.

## Engineering observations

- “Love your enemies” now returns Luke 6:27, Matthew 5:44, and Luke 6:35 first.
- “Jesus wept” returns John 11:35 first.
- “Light of the world” searches passages without changing the theme.
- KJV “charity” results retain the KJV edition in their reader links.
- “Humility” retrieves an exact source paragraph from 1 Clement XIII.
- Supplied text, including HTML-like instructions, renders as text.
- A 503 shard failure is an explicit error; a missing 404 shard remains empty.
- The full Scripture results page can still offer meaning search when its
  lexical index is unavailable.

These are engineering examples, not independently adjudicated relevance
scores. The [audit](find-feature-audit.md) defines the proposed search benchmark.
Human adjudication, held-out quality results, and an adoption decision remain
pending. Production does not expose this private research UI or Jev bridge.

## Verification

Passed on 2026-09-23:

- Lint and TypeScript checks.
- 687 unit tests and 46 smoke tests.
- Production build, including 8,274 generated pages.
- Find popup browser checks: 25 passed across desktop and phone; three
  viewport-specific cases were skipped. Two additional reader translation /
  comparison regression checks passed.
- Dedicated Evidence Explorer browser check: stable submissions, edition
  preservation, early and supplied text, escaping, saved-key live review,
  connection inspection, editorial-review handoff, and a 390-pixel layout.
  No page exceptions or horizontal overflow were observed.
- Browser assets contain neither the direct TypeSafe API endpoint nor its
  credential environment-variable identifier.

The first live website pass completed 20 relevance assessments and four
relationship assessments. A final pass reused all 20 relevance judgments and
one relationship judgment, and completed three new relationship assessments.
Across these passes: **27 new successful requests, 22,100 input tokens and
2,210 output tokens**. Cached replay added no tokens. No findings were
editorially approved by this verification.

The repeatable check is npm run research:find:web:check. Its default mode
makes no Jev calls; adding -- --live explicitly enables the bounded live checks.
Inputs, API caches, screenshots, and raw run data remain Git-ignored.
[Startup, operation, and limits](../../scripts/research/README.md) are documented.

## Independent review follow-up

The [review follow-up](find-review-followup.md) records subsequent fixes for
command capture, edition identity, download disclosure, and Jev presentation,
with updated verification results. Its retrieval experiment did not establish
a quality improvement and was not included in the release. Public Jev hosting
and independently adjudicated evaluation remain pending.
