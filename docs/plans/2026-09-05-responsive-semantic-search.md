# Responsive semantic search

Make abandoned searches cancel promptly while preserving shared model downloads, concurrent readers, source integrity, opt-in consent and ranking quality. Keep each request's progress and results attached to its own UI lifecycle.

- [x] A. Qwen: serialize worker inference, add request cancellation, scope progress to live callers, preserve recovery on actual worker failure. Codex: independently reproduce and correct initialization cancellation, review transport behavior, and verify 25 worker tests.
- [x] B. Codex: add per-consumer waits around shared work, a serialized inline fallback, and cooperative ranking for Scripture and corpus searches. Keep a synchronous reference and prove exact scores, stable row ties and source-parent deduplication. Add cancellation checkpoints before the existing synchronous resonance calculation.
- [x] C. Qwen: build and test the shared request hook. Codex: connect the hook to MeaningRail, MeaningMatches, ResonanceRadar and AfterlifeExplorer; verify the real components through replacement, unmount, reset, StrictMode replay and late callbacks.
- [x] D. Codex: independently review the assembled changes and pass lint/types/unit/smoke/build, real-model browser comparison, 140 end-to-end tests (three existing device skips), and accessibility checks across 36 routes in two schemes.

Delivery uses `agent-task finish` to scan, commit and push the feature branch, followed by a review PR.

## Focused verification

Run with Node 24 (the repository's declared runtime):

```sh
node --import tsx --test tests/semantic-worker*.test.ts tests/semantic-inline.test.ts tests/semantic-ranking.test.ts
node --import tsx scripts/bench/semantic-responsiveness.ts
```

The benchmark is synthetic. Scheduling asks for an 8 ms budget and checks every 128 rows; it does not guarantee an 8 ms upper bound on every browser task. Model inference already executing in WASM cannot be interrupted. Shared downloads finish for other callers, while canceled consumers settle promptly and receive no further progress or results.
