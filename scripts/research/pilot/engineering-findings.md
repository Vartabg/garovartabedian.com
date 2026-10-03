# Initial engineering findings — 2026-09-23

The local workflow is implemented and the live TypeSafe connection is verified. **Adoption has not been demonstrated.** The initial engineering checks ran without credentials; the live follow-up below ran after the user configured their key. Editorial adjudications remain outstanding.

| Check | Observed result |
| --- | --- |
| Draft case preparation | 200 cases → 200 evaluation units; no source-resolution issues |
| Split balance | 50 cases per task in each split; 20 source groups; no identical supplied-text overlap across splits |
| Existing allusions | 27 regression jobs → 43 chunked passage-pair units; no source-resolution issues |
| Small hosted-source preview | 8 planned evaluations, zero Jev attempts |
| 1 Clement 16 / Isaiah 53 discovery preview | 2 source blocks, 12 target blocks, 24 candidate pairs |
| Full hosted WEB retrieval preview | 1 supplied source block, 38,033 target blocks, 20 shortlisted pairs; zero Jev attempts |
| Focused engineering tests | 18 passing; offsets, stale sources/approvals, cache replay, resume, transient failures, budgets, escaping, review/export, argument validation, and benchmark gates |
| Repository verification | Lint, typecheck, unit/smoke tests, and production build passed |
| Browser inspection | Chrome desktop (1360×1000) and mobile (390×844): 8 findings render, context expands, no page exceptions or horizontal overflow |
| Offline development evaluation | 100 incomplete cases, zero adjudications, zero new tokens; precision unmeasured and adoption unpassed |

## Live follow-up after key setup

| Run | Observed result |
| --- | --- |
| Small sample (`pilot-live`) | 8/8 completed; 8 new API attempts; 17,993 input and 619 output tokens reported; 1,210 ms p95 |
| Existing matcher regressions (`regressions-live`) | 43/43 completed across the 27 jobs; 42 new attempts and 1 cached result; 93,814 input and 3,251 output tokens reported; 668 ms p95 for new results |
| Offline sample replay (`pilot-cache-replay`) | 8/8 completed from cache; zero new attempts and zero new tokens |
| Returned model / failures | All 50 new responses reported `jev-1.13.0`; no failed attempts or retries |
| Live HTML report | Eight probability distributions render in Chrome; no page exceptions or mobile horizontal overflow |
| Export without editorial decisions | Zero approved findings exported, despite complete model results |

The two live runs reported **111,807 input tokens and 3,870 output tokens** in total. Latencies include local source verification and response handling; they are observations of this run, not a service-level guarantee. The sample produced five close-wording judgments, two substantial-paraphrase judgments, and one directly-supported claim judgment. The regression run produced 38 close-wording, four substantial-paraphrase, and one thematic-overlap judgment. These are unadjudicated model outputs, **not accuracy measurements**. They do not validate the old matcher's links or authorize publication.

## Private website follow-up

The research workflow now has a development-only browser workspace at `/scriptures/research`, backed by a separate loopback Node process. The API key remains outside the Next process and browser. Production has neither the bridge rewrite nor the research interface.

| Browser exercise | Observed result |
| --- | --- |
| 1 Clement 16 / Isaiah 53:4–6 | Six completed comparisons, all replayed from cache; zero new attempts |
| Supplied claim against John 11:35 | One completed live assessment; 738 input / 72 output tokens |
| Supplied file containing an opposing view and HTML instructions | Two completed live assessments; 1,558 input / 144 output tokens; HTML remained literal text |
| Barnabas 3 / Isaiah 58 discovery preview | One source block, 14 target blocks, 14 candidate units; zero attempts |
| Editorial decision and export | A clearly identified automated UI deferral persisted after reload; zero approved findings exported |
| Desktop and mobile | Chrome 1440×1050 and 390×844; no page exceptions, horizontal overflow, or browser requests to TypeSafe |
| Downloads | JSON and self-contained HTML reports downloaded successfully |
| Research engineering tests | 21 passing, including bridge sessions/origins, review/export, cache replay, stale sources, and interruption without retries |
| Final repository verification | Lint, typecheck, 675 unit tests, 46 smoke tests, and production build (8,273 generated pages) passed |
| Production exclusion | Research page and API return 404, including with the local bridge environment variables set; public Scriptures remains available |
| Credential boundary | All 219 production browser assets checked: no saved API key or direct TypeSafe endpoint |
| Accessibility | Workspace WCAG 2 A/AA and 2.1 AA automated check: zero violations, 17 passing rules on the mobile results view |

These website exercises added **three live requests, 2,296 input tokens, and 216 output tokens**. They did not adjudicate any benchmark label or approve research findings. Local bridge integration tests use a mocked provider to verify accept/reject/defer history, approved-only exports, stale-source rejection, and cache replay without live requests. A separate browser verification command exercises the actual Next proxy and makes no Jev calls.

These observations establish software behavior, not semantic quality. Full retrieval is a scan of the selected hosted WEB corpus; Jev sees only the candidate shortlist. The synthetic cases have construction-pattern limitations even though related source passages are grouped. Existing allusion matches remain unvalidated regressions.

Next required evidence is independent editorial adjudication and the development/held-out benchmark runs. The 200-case benchmark has not been scored live; the connectivity/regression runs above are separate. Development thresholds must be frozen before held-out scoring. The initial offline report explicitly lists incomplete cases, absent adjudications, unmeasured precision, insufficient priority coverage, and the outstanding discovery comparison. The tool stays experimental until all adoption criteria pass on adjudicated held-out data.

Reports and screenshots are local, under the Git-ignored `.research/` directory. No public claims/allusions or semantic publication artifacts were changed.
