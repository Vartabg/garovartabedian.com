# Search integrity: AbacusAI Fable review

The independent reviewer ran in **AbacusAI Desktop**, whose UI displayed **Fable 5.1**, in Plan mode. This records the displayed model/provider; the app did not expose a backend model identifier. Two read-only review passes were requested in the existing “Isaiah 53 Clement Review” conversation, with explicit paths to the separate `scripture-search-integrity` worktree. The reviewer inspected code; it did not run model inference, browser tests, or upstream text verification. This is machine review, not human approval.

The first review confirmed the complete partial-build checks, source/model drift checks, manifest-last publication, vector/reference shape validation, Gospel/additional-book grouping, and disclosed exclusions. It identified the existing asynchronous worker failure path, deep-link opt-in bypass, cross-content score emphasis, misleading merged-list label, and served/stale lock concerns.

| Finding | Disposition |
| --- | --- |
| Dead worker can leave later queries pending | Added a tested worker transport that rejects all pending/future calls on failure, a bounded timeout, and same-query inline recovery. Inline initialization can retry. |
| Deep links record opt-in and download automatically | Auto-run now requires existing opt-in; only explicit searches record the choice. Download size is disclosed before first search. |
| Cross-content scores imply a calibrated winner | Labels report raw scores and uncalibrated content types. Removed the peak pill and special peak styling; combined candidates are selected by default. |
| “All” list excludes fifth-ranked entries and truncates the merged set | Explicitly labeled “Up to 4 per group”; all per-group candidates are retained. No claim of exhaustive global ranking. |
| Suggested numerical relevance floor | Deferred pending labeled query/passage calibration. The existing chapter-neighbor floor is not transferable to query-to-verse scores. The follow-up reviewer agreed. |
| Public stale lock and unclear recovery | Locks moved to ignored `.cache/scripture-index-builds/`, with an explicit recovery message and explicit root/index parameters. No automatic deletion of another process's lock. |
| Conservative partial neighbor builds | Documented as regeneration/verification with unchanged global inputs. Full rebuild required after any dependency change. |

The follow-up review confirmed the worker recovery, download-choice fix, revised labels/list behavior, and non-public lock location. Its remaining suggestions were then addressed: guard teardown so even an exception cannot strand requests; remove remaining peak styling/automatic group selection; and pass the workspace root explicitly to the lock helper. The teardown case has a regression test. The follow-up's heading suggested a successful-response timer bug, but its own body explicitly withdrew that claim; the success path already clears its timer, and the tests verify this.

The reviewer noted that session-long inline fallback after a worker timeout is a tradeoff to document, and agreed that relevance calibration and timeout/device tuning belong to the next benchmark milestone. The local implementation tests additionally cover browser manifest/artifact validation, which were outside the first review's requested file set.

The review is bounded to the source files read during these passes. Final edits after the second pass were verified locally; they were not represented as receiving a third independent review. See [the publication contract](../research/semantic-index-publication.md) for coverage, release identifiers, recovery instructions, verification scope, and remaining limitations.

The final staged audit initially classified two tokenizer checksums as generic API keys. They were verified against the local model files, and model provenance was serialized as explicit path/hash records. No scanner exemption was added. A final integrity check also binds the full semantic manifest (including chapter row order) to its release digest in both the browser and neighbor builder; these final changes have local regression tests and were not part of the two Fable passes.
