# Independent design review

Plan: `2026-10-26-jesus-first-pass.md`, revisions 1–2. Source baseline: `a0f8e8dd21d89c76762e7773976a3614a822922f`.

Reviewer: Gemini 3.8 Flash High through Antigravity, fresh supplied-text sessions in an empty temporary workspace. Both runs completed with `init.model=gemini-3.8-flash-high` and terminal `result.status=SUCCESS`; no tool calls or edits were requested. Conversation IDs: `7c1173c8-eb4e-4d81-be12-b3064a14aa35` (revision 1, 97s) and `80119e97-be76-49f7-bf20-be78028cd701` (revision 2, 47s).

Reading list: root AGENTS, plan, LifeLenses, MomentPanel, LifeRoom, Harmony page. Targeted second review supplied revision 2, LifeLenses, LifeRoom and actual moment IDs. Scope of independent design review: overview starts and map handoff. Comparator label corrections remain a routine editorial change, verified against the implementation separately.

## Findings and dispositions

- Fragment targets exist only after expansion; accepted. Preserve existing IDs, recognize both life-event and life-stop URLs, open the event and scroll to its permanent article after render. Scroll requests are consumed separately from passage arrivals.
- Exact Sermon start ID unspecified; accepted. Revision 2 names `sermon-on-the-mount`, verified in the current data.
- Uncaught malformed hash decoding in the overview; accepted. Ignore malformed encodings in both overview and map.
- Second review repeated the above baseline implementation defects and emphasized late-arriving text must not scroll. These are explicit revision-2 requirements, not unresolved design choices. Implementation and browser regressions will verify them; the baseline was deliberately unchanged during design review.
- Optional passage retry: deferred outside this focused first pass.
- Optional separate releases: declined. The user explicitly requested these three scoped improvements as the first pass; they form one bounded, verifiable release.

No unresolved design decision requires user input. Lead reviewed the actual results against source and authorized implementation of revision 2. This records completed review and dispositions, not a claim that unmodified code passed verification. Actual rendered results, tests and diff review remain required.

Review value: clarified exact IDs, malformed-fragment handling and scroll lifecycle. The second reviewer treated planned repairs as missing implementation, so its blocker labels do not establish additional plan defects. No productivity claim is inferred.

## Implementation review

A fresh native Codex reviewer (`jesus_diff_review`) read the plan, actual diff and relevant implementation without parent history. It caught stale inspector classifications when the function-word filter changes and a prayer synopsis that described a shorter Greek form as though it also described the displayed WEB English. Both were corrected. Its final review reported no remaining actionable findings. Browser testing separately caught hover overriding selection after hash/reload scrolling; the opened-event hover guard fixes it and both desktop/phone regressions pass.

Muse Spark 1.3 Contributor completed the bounded comparator-copy edits with the configured model and terminal completed status verified. Lead inspected the actual diff, refined normalization explanations and edition-specific summaries, and verified that Scripture witnesses, other non-editorial data and the comparison algorithm were unchanged.

Production-build testing exposed a hydration replay race beyond the initial hover guard: a hover update queued while the event was closed could overwrite restored map focus. A second native review identified the separate state queues as the cause. Focus and expanded event now update atomically, and the hover updater checks the current expanded event inside that same queue. Explicit keyboard focus, clicks and map controls retain their behavior. The production reload regression remains a release gate.

The fresh reviewer approved the atomic selection change with no remaining findings. All 11 focused browser cases then passed twice against the production build (22 checks), including desktop and phone reloads, direct links, changing fragments, saved overview state, keyboard starts, and comparator state changes. Rendered overview and comparator screenshots were inspected at both widths; the mobile View label was kept on one line.
