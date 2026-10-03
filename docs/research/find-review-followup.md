# Find review follow-up

This update addresses the defects reproduced after the independent Find review.
It does not establish retrieval accuracy or enable the private Jev bridge in
production.

## Corrections

- **Explicit commands:** ordinary phrases such as `root of all evil` and
  `compare love and fear` remain text searches. Scholarly and preference
  commands require `>` or `/`; `?` opens the command directory. Explicit
  scholarly commands take precedence over preference keywords inside them.
- **Edition identity:** public meaning results retain WEB text and locations;
  Nave results retain KJV text and locations. Each section names its edition.
  Exact word results still use the selected edition. Deduplication only removes
  matching locations within the same edition. In the private engine, non-WEB
  Scripture uses its own word/phrase search with an explicit coverage note;
  KJV alone receives Nave references. There is no verified cross-edition
  semantic alignment yet. A global Psalm-number offset would not handle the
  editions' chapter splits, joins, and verse differences.
- **Download disclosure:** all browser meaning-search entry points describe
  approximately 47 MB of model and runtime files, plus search data. The two
  measured assets total 46,539,420 bytes. Cache reuse depends on the browser.
- **Jev presentation:** review ordering follows the displayed relevance group,
  then the helpfulness estimate, then retrieval rank. Connection selection uses
  that same order. Assessments are explicitly unreviewed; uncertainty and
  ranking numbers are collapsed by default and explained as model outputs,
  not accuracy measurements or probabilities that a claim is true.

## Retrieval diagnostic

Eight queries were run against the original engine, the corrected engine, and
an isolated query-expansion experiment: loneliness, feeling abandoned, grief,
forgiving someone who hurt me, hope when afraid, care for strangers, love your
enemies, and humility. No Jev requests were made.

The experiment added bounded word families and a separate reciprocal-rank
retrieval contribution. It was **not included**: some passages rose while
others fell, and the two missing loneliness examples remained absent.

| Query and diagnostic passage | Original top-20 rank | Corrected engine | Expansion experiment |
| --- | ---: | ---: | ---: |
| loneliness — Genesis 2:18 | Absent | Absent | Absent |
| loneliness — Psalm 25:16 | Absent | Absent | Absent |
| loneliness — Psalm 68:6 | Absent | Absent | 2 |
| loneliness — John 16:32 | 8 | 8 | 4 |
| hope when afraid — Psalm 56:3 | 3 | 2 | 10 |
| care for strangers — Hebrews 13:2 | 7 | 7 | 2 |
| forgiving someone who hurt me — Colossians 3:13 | 4 | 4 | 3 |

These selected passages are diagnostic examples, not adjudicated relevance
labels. The table is not a precision or recall estimate. The corrected engine
removes KJV Nave contributions from WEB searches to preserve source numbering;
this can change retrieval order. The top five loneliness results remained
unchanged. “Love your enemies” retained Luke 6:27, Matthew 5:44, and Luke 6:35
as its first three results. The humility example still retrieves 1 Clement XIII.

Raw query results and experimental engine copies remain local in ignored
`.research/`. A useful next retrieval change needs a labeled development set
and a separate held-out comparison, including false links and missing relevant
candidates. Jev cannot assess a passage omitted from the shortlist.

## Verification

- Lint, TypeScript, 692 unit tests, and 46 smoke tests passed.
- The production build generated 8,274 pages.
- The Find popup browser suite passed 31 desktop/phone cases, with three
  viewport-specific skips. Four new cases were rerun successfully after
  correcting their accessible-name test selector.
- The private workspace browser check passed seven checks, with no page
  exceptions and zero provider operations. Saved assessments were replayed to
  check the collapsed uncertainty details.
- A browser run using the actual meaning model, with Douay–Rheims selected,
  displayed WEB meaning links and the WEB text of Psalm 23:1. The native DRB
  Psalm 22:1 lexical result is also covered by an engine regression test.
- Desktop and phone popup accessibility checks reported no automated WCAG A/AA
  violations, no page exceptions, and no horizontal overflow. This is a
  bounded automated check, not a complete accessibility audit.

## Remaining release work

The private bridge remains local. A public Jev service still needs isolated
jobs, durable cache/quota storage, per-visitor limits, a shared spending ledger,
and asynchronous progress reporting. No credentials or private research runs
are published by this update.

Retrieval quality, Jev classification quality, editorial adjudication, and the
adoption gate remain unproven. No findings were approved by these checks. A
public launch and LinkedIn demonstration must describe these limits accurately;
textual resemblance alone is not evidence of quotation or historical influence.
