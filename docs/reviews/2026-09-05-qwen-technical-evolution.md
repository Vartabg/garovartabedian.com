# Qwen technical review and responsive search

Qwen 3.8 Max, operated through OpenCode, reviewed the application and implemented the worker cancellation layer and shared React request hook. Codex selected the scope, implemented cooperative ranking, fallback integration and component wiring, and independently reviewed the assembled change.

## Why this change

The site already has static App Router pages, a self-hosted quantized embedding model, content-addressed semantic artifacts, source provenance validation, and CI checks for integrity and accessibility. The immediate weakness was request lifetime: leaving or replacing a meaning search did not cancel its work, and some callbacks could still update old UI state. The shared embedding engine also retained the first caller's progress callback.

This change gives each consumer a signal and progress handler. Canceling one request skips its queued inference, suppresses running results, and preserves the model and other callers. Genuine worker failures still terminate the failed worker and recover through a serialized inline implementation. Cancellation during model initialization settles the caller without starting its abandoned inference.

Scripture and corpus ranking yield cooperatively through `scheduler.yield()` when available, with a timer fallback. Scripture top-k selection retains a heap of candidates instead of sorting every verse. Corpus ranking still ranks all chunks before choosing each source parent's strongest excerpt. Stable row ties and exact scores match the pure synchronous reference. Scripture ties across books now follow candidate-book order rather than network completion order.

## Local benchmark

Run `node --import tsx scripts/bench/semantic-responsiveness.ts` with Node 24. A synthetic 16,000-row, 384-dimension, top-40 workload on this development Mac produced ten samples with identical rankings:

| Measurement | Result |
| --- | ---: |
| Synchronous median | 9.250 ms |
| Cooperative median, including yields | 11.063 ms |
| Largest observed cooperative work slice | 8.140 ms |
| Total yields across ten samples | 10 |

This measures the scheduling tradeoff, not visitor latency or a guaranteed frame-time bound. Running WASM cannot be preempted. The existing pure Omni-Corpus resonance calculation remains synchronous; its async wrapper cancels during loading and yields/checks once before entering the calculation. Parsing, integrity validation and final sorting also remain synchronous.

## Follow-up priorities

1. Measure mobile interaction latency in the rendered search flows and profile the resonance calculation before moving more work to a worker.
2. Measure the initial bundle impact of loading FindOverlay and nested ResonanceRadar on demand. Preserve keyboard shortcuts, deep links and download consent.
3. Benchmark an opt-in WebGPU path on supported devices before considering a default. Keep WASM fallback and verify retrieval parity; GPU availability alone does not establish a performance gain.
4. Evaluate persistent-storage requests within the existing offline-reader consent flow and display the actual storage outcome.

No framework or model upgrade was needed for the request-lifetime fix. Browser scheduling support is progressive enhancement; see [the Scheduler.yield API](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield). A future GPU experiment should follow [Transformers.js WebGPU guidance](https://huggingface.co/docs/transformers.js/guides/webgpu).

## Verification

The initial complete verification used Node 24.20.0 against the production build on base `3025bb7`:

- Lint and TypeScript checks passed.
- 615 unit tests and 40 smoke/integrity tests passed.
- Production build generated 8,064 pages; shared First Load JS remained 103 kB.
- Full Playwright suite: 140 passed, three existing device-specific skips.
- Accessibility gate: 36 routes in light and dark schemes, plus 36 Lighthouse accessibility reports; minimum Lighthouse score 98%. The runner completed with exit status 0 after a slow browser shutdown.
- Real-model browser check: the entire meaning-search region for `light` matched the saved baseline exactly (12,006 characters, including scores and nested resonance results). Rapid preset replacement displayed the latest query; no browser errors or warnings.
- The reviewed code keeps model weights, corpus artifacts, provenance validation, public copy, styling and download consent intact.

After integrating upstream map changes through `bc0f8be`, lint, types, all 617 unit tests, 40 smoke tests, the production build and all 140 browser tests passed again. The upstream changes touch map files and add a tile-domain connection allowance; the search implementation is unchanged. The 36-route accessibility result above records the initial complete matrix. A final read-only Qwen review of cooperative ranking and the serialized fallback found no blocking issues.

For release, the branch was synchronized with `020ed24`, including the Angels story and the stabilized journey-contrast checks. Using Node 24.19.0, lint, TypeScript, all 617 unit tests, 40 smoke tests and the production build passed. The expanded Playwright suite passed 149 tests with three existing device-specific skips. The complete accessibility gate passed all 37 routes in light and dark schemes and their Lighthouse checks. This synchronization does not change the reviewed search implementation.
