# Isaiah–Clement reading preview

The first reading-to-connection journey is at
`/scriptures/read/isaiah-53-clement-16`. Find lists it as **Isaiah and 1 Clement —
Reading path**, and the existing source investigation links to it. It is a
preview on `codex/jev-research`, not a site-wide reader replacement.

## Existing pieces reused

- The source-checked Isaiah 53 / 1 Clement 16 investigation, exact excerpt
  spans, translations, source hashes, editorial draft and source links.
- The hosted Find API, private guest sessions, Postgres jobs/cache, Vercel Queue,
  provider version, credential configuration and spending controls.
- The local research relationship rubric and strict response validation. Its
  definitions now live in `scripts/research/rubric.ts`; the local client re-exports
  them. The hosted worker never imports the local credential-loading client.

The design reference was inspected at
`~/.codex/worktrees/annotated-reading/Research-Vault/site/README.md`,
`site/scripts/browser/annotations.js`, and `site/styles/edition.css` at Vault
commit `6ef99301bfd9019c92f57ed2720bc2aa3c0b7e5e`. This is **unrated implementation
evidence**, not reviewed research or a performance benchmark. The Vault trust
audit passed; there were no matching curated reading claims. No Vault content,
credentials, publication endpoint, or source documents were copied into this site.

## Reader behavior

Read is the default on every page load. Trace changes the passage markings;
both modes use the same original text. Teal/solid means source, copper/dashed
means editorial interpretation, and violet/dotted means open question. Labels
remain visible, and monochrome retains all three patterns. These identify
roles, not certainty or evidence quality.

The page opens with Isaiah 53:4–6 and offers the complete 12-verse chapter.
It then renders all of the hosted 1 Clement 16, including the introduction,
the Isaiah quotation, the following psalm quotation and the conclusion. Inline
notes use the existing verified spans without replacing any source characters.
The edition's chapter heading is explicitly described as editorial material.

Source notes open in a native modal with a persistent return control. Closing
or Escape restores the invoking control and exact scroll coordinates. Static
source notes, return anchors, both readings and the existing evidence packet
remain usable without JavaScript. Page themes and text size are scoped to this
reader; monochrome and preferences are saved locally. Existing accessibility
font and text-spacing choices still apply.

The comparison module uses an explicit dynamic import only after a reader
chooses comparison. Reading, opening source notes and switching to Trace do not
request models or assessments. An AI check is a separate explicit action within
the comparison. It never generates replacement prose or assigns editorial colors.

## Hosted pair evaluation

`POST /api/find/jobs` now accepts an optional hosted `anchor` locator alongside
its existing candidate locators. With an anchor, each item uses the existing
relationship rubric. Without one, existing relevance behavior and cache keys
are preserved. The anchor counts toward the 20-passage maximum, and pair checks
share the existing 10-new-jobs-per-guest daily allowance with search checks.
Network/site caps, budgets, global concurrency, retries, session isolation and
seven-day expiry are unchanged.

The first journey checks Isaiah 53:5 with its neighboring verses against the
**full first paragraph of 1 Clement 16**. The comparison UI separately shows the
two exact suffering/healing excerpts, and clearly states the wider evaluation
scope. No source is silently shortened. The existing 24 KB request ceiling still
applies. Both source snapshots are checked before and after the provider call.
The pair, source hashes, rubric and model all participate in cache identity.

AI results are always visibly **Unreviewed**, including on restored results.
Editorial interpretation is separately marked **Unreviewed draft**. Neither an
exact-source check nor a model score promotes a finding to reviewed. Historical
borrowing, agreement and proof cannot be inferred from the similarity result.
No public approval action has been added; editorial review remains a separate
workflow. Existing approved-only research export is unchanged.

## Verification

The new unit checks cover exact text reconstruction, original contexts, valid
span boundaries, allowlisted preferences, pair request scope and response
validation. Four additional real-Postgres checks cover shared quotas, cache
separation, anchor invalidation, session isolation, response-type rejection,
server source resolution and the total source limit.

Browser coverage exercises 320px, 390px and 1440px note return; deferred code
loading and zero assessment requests while reading; source text round trips;
large text and preference persistence; all explicit themes and monochrome;
unreviewed results, reload recovery, escaped text, exhausted allowance fallback;
and no-JavaScript reading. Automated accessibility checks are bounded WCAG A/AA
checks, not a claim of complete accessibility or physical-device validation.

This unit evaluates the reading experience and engineering behavior. The broader
human-adjudicated relevance/relationship pilot and production release checks
remain separate from this preview.
