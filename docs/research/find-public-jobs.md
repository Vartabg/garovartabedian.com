# Find public job infrastructure and retrieval pilot

The new public assessment path is separate from the loopback research bridge.
It is disabled unless its server configuration and database control both
enable it. The public Scripture search page offers assessment of up to 20
displayed word or meaning results when enabled. It continues to use its
existing retrieval; the private Explorer has not been exposed wholesale.

Visitors see **Find relevance check**, with an Experimental AI label and the
10-check daily browser allowance. Provider branding and model version strings
are kept out of the visitor interface; the original model/version remains in
the stored results for auditing. The expandable privacy explanation describes
the external AI request, browser session, expiry and shared limits. Checks only
run when a visitor chooses them, and visitors never need a provider API key.

## Request and worker boundaries

1. `POST /api/find/session` issues a signed, HttpOnly, SameSite=Strict guest
   cookie. HTTPS adds Secure. Mutations require the configured same origin.
2. `POST /api/find/jobs` accepts a question of at most 500 characters and
   1–20 hosted Scripture/early-writing locators. It cannot accept arbitrary
   source text, files, filesystem paths, models, rubrics or provider endpoints.
   The server resolves exact source text, context, edition and hashes. Oversized
   passages or context are refused, never silently truncated.
3. Postgres atomically admits the job and records quota usage. A repeated
   identical request in the same guest session restores the saved job.
4. A Vercel Queue notification starts the private consumer at
   `/api/find/worker`. Its trigger registration is in `vercel.json`. The queue
   carries a job ID; source text and questions remain in the database.
5. Database leases, bounded attempts and a shared accounting lock prevent
   duplicate claims and coordinate all workers. Two provider calls can be in
   flight site-wide. The queue redelivers unfinished jobs; refreshing a browser
   is not needed for processing to continue.
6. `GET /api/find/jobs/:id` returns only the owning guest's result. DELETE
   cancels undispatched work; already dispatched calls can still incur usage.
   The browser saves the job ID, polls progress and restores it after refresh.

Database jobs expire after seven days; expired rows/cache entries are purged
on subsequent admission. Accounting rows are retained for 35 days. Queries are
not placed in queue payloads or provider-error logs. Network identifiers are
HMACs; Vercel's trusted client-IP header is used and IPv6 addresses are grouped
by /64. Guest cookies are an abuse-control layer, not proof of unique people.
The global limits remain effective if someone replaces their cookie.

## Limits and costs

- 10 new jobs per guest session/day; 50 per network/day; 1,000 site-wide/day.
- 20 candidates/job; two concurrent provider attempts across the database.
- Three total attempts/candidate; 30-second provider timeout. Only transient
  failures with acceptable backoff are retried. Jobs exceeding a 30-minute
  processing window become explicitly incomplete.
- $2/day and $20/month of Jev cost at the pinned rate, in UTC buckets.
- Every attempt reserves the full 64,000-token model limit before dispatch.
  Measured usage settles the reservation exactly once. Unknown/time-out costs
  remain reserved; retries create separate reservations. Unexpected usage above
  the reserved bound disables new dispatch.
- Database failures and disabled controls fail closed for assessments. Ordinary
  search remains usable. Completed responses are validated before caching;
  the key includes the query, source/context, edition, model and rubric.

The configured rate is 42 nanodollars per input token ($0.042/million), with
output free, checked against [TypeSafe's model documentation](https://docs.typesafe.ai/models)
on 2026-09-24. These are application limits calculated at that rate, not a
provider-enforced guarantee against unannounced price changes. Hosting, queue,
storage and network charges are separate. Recheck provider pricing before
enabling production and on model changes.

The implementation uses [Vercel Queues](https://vercel.com/docs/queues), currently
beta, directly. Its at-least-once delivery requires database idempotency; the
queue alone does not make provider calls exactly once. The larger Workflow SDK
was evaluated but is not a dependency of this implementation.

## Setup and operation

A dedicated Neon `find-preview` database was provisioned on the **free_v3** plan
in **iad1**, connected to Vercel's **preview environment only**, using the
`FIND_` environment-variable prefix. No existing database was repurposed.
The schema was applied. Dispatch is enabled for the protected feature-branch
preview only; production assessment remains disabled.

Configure these server-only variables for the intended environment:

- `FIND_DATABASE_URL`: pooled Postgres connection with TLS for hosted databases.
- `FIND_SESSION_SECRET`: independently generated secret of at least 32 characters.
- `FIND_PUBLIC_ORIGIN`: exact HTTPS origin allowed to use the service.
- `TYPESAFE_API_KEY`: private TypeSafe credential; never a NEXT_PUBLIC variable.
- `FIND_PUBLIC_ENABLED=1`: enable the UI/server path after verification.

The local saved key is not automatically uploaded to hosting. No production
Jev key or enabled production flag was added by this unit. Preview and production
must use separate database resources/accounting domains. Anonymous browsing
does not require visitors to supply a key.

The saved key, a new session secret, and the enable flag were configured only
for the `codex/jev-research` preview branch. Preview deployments can use their
Vercel-provided exact deployment URL as the origin; production must explicitly
configure its canonical HTTPS origin. `.vercelignore` excludes private research
inputs, credentials, caches and local reports from deployment uploads.

```sh
# Supply private environment variables first, without putting values in commands.
npm run research:find:server -- migrate
npm run research:find:server -- status
npm run research:find:server -- enable
npm run research:find:server -- disable
npm run research:find:server:check
```

`migrate` is explicit and repeatable; page requests never apply schema changes.
`enable` affects the database control only; the environment gate must also be
configured. `work <job-id>` processes one live provider attempt and requires a
configured key. The integration check creates and removes an isolated local
Postgres cluster and uses fixture provider responses. Set `PG_BINDIR` if the
installed Postgres tools are not discoverable through `pg_config`.

## Verification on 2026-09-24

- Lint, TypeScript, 696 unit tests and 46 smoke tests passed.
- Twelve real-Postgres integration checks passed: concurrent quotas, idempotent
  admission, session isolation, site/network caps, global leases, budget
  exhaustion, crash recovery, stale worker fencing, cache settlement, cancellation,
  stale sources, invalid responses, cross-origin/forged input and expiry. Queue
  failures also release their own dispatch cooldown so an immediate retry resumes
  the saved job; a late sender cannot clear a newer reservation.
- The production build with the assessment UI enabled generated 8,277 pages.
  It required no database credentials and made no Jev calls.
- Desktop (1440px) and phone (390px) browser checks verified progress, refresh
  recovery without resubmission, escaped source text and quota-error fallback.
  No page exceptions, horizontal overflow or automated WCAG A/AA violations
  were observed. Browser provider responses were fixtures.
- One explicit hosted database/worker smoke call completed against `jev-1.13.0`:
  **679 input tokens, 84 output tokens**, 28,518 nanodollars at the configured
  rate. Dispatch was disabled again afterward. This was an integration check,
  not a relevance-quality result or editorial approval.

The protected preview is available at
[Find preview](https://garovartabedian-qru8axbly-garo-vartabedians-projects.vercel.app/scriptures/search).
It runs code from `b5d62d804d3ba092669eb520888bf564eee993a0` and requires
Vercel sign-in. Its private queue round trip passed: a new guest submitted a
hosted John 11:35 assessment, Vercel delivered it to the worker, and Jev returned
**682 input tokens / 85 output tokens** in one attempt. The ledger settled
28,644 nanodollars once. Repeating submission reused the same job. Another guest
received 404; cross-origin mutations received 403; the private worker URL
returned 404 even to an authenticated preview request.

A live browser assessment of Genesis 4:21 for “Jubal” also completed in one
provider attempt (**722 input / 84 output tokens**). Reloading restored the same
saved result; the database still held one job and one attempt. Source/context
details rendered correctly. Across the three successful live checks in this
unit, Jev reported **2,083 input / 253 output tokens**, with 87,486 nanodollars
recorded at the configured rate. These are engineering checks, not relevance
quality findings or editorial approvals. Use the exact deployment URL above;
the strict origin check does not currently accept a separate branch alias.

Use GitHub-source preview deployments with the exact verified commit SHA and
`codex/jev-research` branch. The CLI version used during this run reads
`.git/config` directly and missed the remote in a linked worktree. A plain local
CLI deployment consequently lacked GitHub metadata and branch-specific settings;
its assessment service correctly stayed unavailable. Supplying Vercel's
`gitSource` with the existing repository, branch and SHA selected the right
preview settings. It leaves automatic Git deployments disabled and preserves
normal Vercel author/access checks. Do not rewrite history or relax those checks.

The repository's existing dependency advisories, including Next.js and MapLibre,
still require pre-release security assessment before public activation. This unit
does not claim to remediate unrelated dependencies. Human-adjudicated quality
results and production activation remain pending.

## Retrieval status

See the [search pilot](../../scripts/research/search-pilot/README.md). It now has
100 draft queries, resumable broad-pool collection, two-reviewer labels,
disagreement adjudication, stale-label handling, metrics and a held-out freeze
guard. All 50 development queries were collected against two variants with no
retrieval issues; 1,160 top-20 pooled records remain ungraded.

For loneliness, the 200-candidate baseline recovered Genesis 2:18 at rank 168
and Psalm 68:6 at rank 36; Psalm 25:16 remained absent. Adjacent-verse lexical
retrieval did not change those ranks. These observations do not establish
accuracy or justify changing the default ranking. The 50 held-out queries
remain unrun. Jev-versus-baseline quality comparisons and the original
relationship/support adoption gate still require independent adjudication.
