# Agent Instructions

## Completion Contract

For any task that changes files, the agent owns the full lifecycle unless the
user explicitly says not to commit or push.

Before the final response:

1. Run verification appropriate to the change.
2. Stage only files in the task scope.
3. Commit with a concise, descriptive message.
4. **Security gate (non-negotiable):** run a secrets/history audit (fail on any
   finding) before any push.
5. Push the current **feature** branch to its upstream — do not push `master`
   directly; ship via PR/merge only after the audit passes.
6. Confirm `git status --short --branch` is clean.

A dirty worktree is not by itself a reason to skip commit or push. At the start
of a task, classify dirty files as task-related or unrelated. Commit
task-related files. Do not stage unrelated user-owned changes.

If commit or push is unsafe or impossible, the final response must say exactly
why, list the blocking files or command failure, and state the next required
action.

## Verification

- For source changes, run `npm run lint`, `npm run typecheck`, `npm run test`,
  and `npm run build` (or `npm run check`, which chains them).
- `npm run test` = unit tests (`tests/`) + smoke integrity (`scripts/smoke/`,
  includes media audit). Prefer targeted `test:unit` / `test:smoke` while
  iterating.
- For route or visual UI changes, also run the app locally and perform a browser
  sanity check when feasible.
- For docs-only changes, `git diff --check` is sufficient unless the docs edit
  changes commands, links, or generated artifacts.
- `.github/workflows/ci.yml` is `workflow_dispatch` only for optional manually
  requested verification: no automatic push/PR runs, no Actions deploy path,
  and no required CI statuses. After a merge, do not wait for Actions — run
  the local release (`npm run release:production`) when the unit should go live.

## Project Shape

- This is a Next.js App Router site.
- Shared portfolio substance lives in `src/lib/portfolio-content.ts`.
- Keep claims truthful. Do not invent metrics, employers, customers, users,
  revenue, military specifics, or product status.
- Prefer extending the shared content spine over duplicating copy inside route
  components.
- Keep the public site static-friendly and recruiter-safe.

## Git Workflow

- Use a **feature branch** for changes; **do not commit or push `master`
  directly** (global rule: never push a shared default branch). Ship by merging
  the verified feature branch after the secrets gate passes.

## Ship Cadence (merge / deploy as you go)

Default: **small, finished units ship promptly** — do not batch an entire
engineering pass into one mega-merge.

- Prefer one coherent change set per merge (e.g. a bugfix, RSC world homes,
  or a media pass) over stacking unrelated work on open branches.
- Merge the **feature branch** into `master` (after the secrets gate and
  verification pass), then run `npm run release:production` from a repository
  checkout when a verified unit should go live. Ship each finished unit without
  waiting for Actions or the next multi-item milestone. Never push `master`
  directly — always route through the audited merge.
- Keep code fixes and huge media/history rewrites separable when practical so
  deploys stay reviewable and bisectable.
- Rebase or merge `master` into the feature branch before merge if other work
  has landed and files overlap.
- Exception: hold a ship only when the user says so, or when the unit is
  incomplete / fails verification.
