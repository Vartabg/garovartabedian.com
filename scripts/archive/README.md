# Archived One-Off Scripts

Historical one-off generators moved out of active world directories because they
have been superseded by general pipelines or have drifted behind subsequent
direct edits to their committed outputs.

Files in this directory are **excluded** from the active build-script count in
[`scripts/site/build-site-xray.mjs`](../site/build-site-xray.mjs) and
[`public/meta/site-xray.json`](../../public/meta/site-xray.json).

## Safety Guard

Every archived writer refuses to execute by default (`exit 1`) unless invoked
with `--allow-archived-overwrite`. Do not pass that flag unless you intend to
diff and reconcile every overwritten file under `public/`.

## Inventory

| File | Original path & commit | Reason archived | Active replacement / current state |
|---|---|---|---|
| `generate-thessalonians-v2.mjs` | `scripts/scriptures/generate-thessalonians-v2.mjs` (`87473bc4`, 2026-09-02) | Hardcoded one-off batch writer for 1 & 2 Thessalonians V2 guides; zero external callers. | `npm run data:guides` (`scripts/scriptures/build-guides-v2.mjs`), `npm run data:guides:rebind`, and `scripts/scriptures/stamp-guide-review.mjs`. |
| `build-synoptic-pericopes.mjs` | `scripts/jesus/build-synoptic-pericopes.mjs` (`30d4685a`, 2026-09-04) | Initial extractor for `public/jesus/synoptic-pericopes.json`; zero external callers. Committed `public/jesus/synoptic-pericopes.json` was subsequently directly revised on 2026-10-26 (`e44579f3`) to update `traditionLabel` and `synopsis` prose without updating this script, so running it reverts reviewed edits. | Edit `public/jesus/synoptic-pericopes.json` directly or port the reviewed `e44579f3` wording before regenerating. |

## Queued for Archiving Later

- `scripts/scriptures/generate-romans-v2.mjs`, `romans-data-1.mjs`, and
  `romans-data-2.mjs` (one-off Romans 1–16 batch writer from `723cd5cf`,
  2026-09-02) are temporarily held in `scripts/scriptures/` while concurrent
  unmerged branch `codex/grok-content-review` modifies two of those files. Move
  them here with `--allow-archived-overwrite` once that branch lands or closes.
