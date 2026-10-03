# Pilot protocol

Status: **experimental; no editorially validated quality claim**.

`cases.json` contains 200 cases: 100 passage relationships and 100 claim-support assessments. Each task has 50 development and 50 held-out cases. Twenty source groups keep related Scripture passages and chapter context within a split. Source bytes are pinned, and the validator rejects changed sources and cross-split group/context reuse.

These are **Codex-authored draft labels**, not expert adjudications. Synthetic paraphrases and related templates are not representative of all research questions. The fixture set includes English translation comparisons, shared vocabulary with different meanings, negation, metaphor, attribution of opposing views, ambiguous fragments, contradictory testimony, prompt injection, and translator commentary misattributed to an ancient author. Engineering tests separately cover long-document boundaries, duplicate rankings, source changes, retries, unsafe HTML, and stale decisions.

`regression-jobs.json` reproduces the 27 existing allusion matches, including 1 Clement and Barnabas. Long paragraphs expand those jobs into multiple independently evaluated chunks. These links are **regression cases, not independently validated labels**. `sample-jobs.json` is a small live connectivity/presentation pilot. Do not tune against held-out judgments after opening them.

## Adjudicate, develop, freeze, then evaluate

1. An editor checks each development case against the selected edition and surrounding context, records disagreements and a final label, and reviews whether source groups or synthetic construction patterns create unwanted leakage. Refine the suite before freezing; any source or case change invalidates its prior adjudication.
2. Run development evaluation and choose thresholds from that data only. The program refuses to calibrate a task unless every development case is complete and adjudicated.
3. Preserve the emitted immutable calibration file. Adjudicate held-out cases without seeing model predictions, then run held-out evaluation with that exact file. Changing development adjudications invalidates the calibration.
4. Evaluate discovery separately with `--discovery`. Only adjudicated pairs count. Assess unjudged shortlist entries separately before drawing broader corpus conclusions.

Example commands (replace label, reviewer, notes, and calibration filename after actual review):

```sh
npm run research:jev -- adjudicate --suite scripts/research/pilot/cases.json --case group-01-r1 --label close-wording --reviewer 'Your name' --notes 'Compared unchanged source and context; rationale recorded here.'
npm run research:jev -- evaluate --suite scripts/research/pilot/cases.json --phase development
npm run research:jev -- evaluate --suite scripts/research/pilot/cases.json --phase held-out --calibration .research/evaluations/EVALUATION_ID/calibration-HASH.json --discovery
```

`--offline` computes reports from available caches with no Jev calls; missing outcomes remain incomplete. The suite's draft labels are visible for editorial review but never count in precision, per-label accuracy, or discovery results before adjudication. Do not mechanically accept all draft labels. Record the editor's identity, notes, and date via the adjudication command. Records stay local at `.research/benchmark-adjudications.json`.

The frozen review-priority thresholds use the probability of the selected label. Prioritized positives mean close wording/substantial paraphrase for relationships and direct support for claims. For each task, held-out prioritized findings must attain **at least 95% observed exact-label precision at at least 20% coverage**, with all cases completed and adjudicated. Reports include numerator/denominator counts, Wilson 95% precision intervals, per-label results, abstentions, false links/support, editorial review coverage, p95 latency, and actual newly reported token usage.

Discovery separately measures candidate recall and accepted connections against the existing rare-word matcher on the same supplied blocks. Its gate requires more adjudicated connections recovered without a greater false-link rate. It reports counts and Wilson intervals. This comparison covers judged pairs only: other shortlisted passages remain unjudged. The baseline measures the existing `matchQuotation` scorer, not its upstream quotation-mark detector. Retrieval coverage is not classification accuracy, and neither establishes historical influence.

If any criterion fails or evidence is missing, reports remain experimental and identify the unpassed gates. The software cannot declare adoption on fixture output, absent credentials, draft labels, or cached results from a different model/rubric. Successful engineering checks do not substitute for editorial adjudication and live pilot results.
