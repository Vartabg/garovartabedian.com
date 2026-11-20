# Review record: remove the batch-template chapter guides

- Plan reviewed: `docs/plans/remove-template-guides.md`, revision 1, against
  `master` at `1f4542ba` in the task worktree.
- Reviewer: one fresh-context agent (Claude Sonnet 5.5), read-only, given only
  the plan and a reading list. It reported what it opened and what it skipped.
- Completion: the reviewer finished and returned a full report (17 tool uses).
- Verdict: **Ready after blockers fixed.** Both blockers are fixed in
  revision 2. No second review was run; the fixes are corrections to test
  rules, not new design.

## Blockers

1. **"No orphans" was tied to WEB.** ENO and JUB guides sit on Charles texts.
   Accepted. The rule now uses the existing `hostedTextsFor(book)`.
2. **The replacement coverage rule was not stated,** and
   `tests/e2e/recruiter-path.spec.ts` asserts coverage status too. Accepted.
   Revision 2 states the one rule that stays and lists the spec.

## Optional findings

1. `build-guides-v2.mjs --only-template` loses its queue. Accepted as a note in
   the plan; no code change here.
2. The removed box held "Book overview" and "Sources" links. Checked: both
   exist elsewhere on the page. Noted in the plan.
3. Name the regeneration commands. Accepted.
4. Hard-coded counts in `tests/chapter-xray.test.ts` and the string in
   `tests/world-xray.test.ts`. Already in scope; confirmed.
5. Labs page line 77 says "complete structural coverage". Accepted; the label
   is reworded.
6. Guide URLs are cached for a day plus a week of stale-while-revalidate.
   Accepted as a failure-behavior note.

## Checked and found fine by the reviewer

No other consumer of the guide files: embeddings, search, sitemap and x-ray
scripts do not read them, and `public/scripture-sw.js` does not touch them.
None of the guide files that tests read is flagged as a template.

## Limits

The reviewer did not open `guide-template.ts`, `server/guides.ts`, `client.ts`,
`xray-types.ts`, or the full `xray-tags.ts`, `world-xray.ts` and
`corpus-health.ts`. The author read those.
