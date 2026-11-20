# EGM review — Angels Arc plan

- Plan: docs/plans/2026-11-09-angels-arc-spine.md (reviewed from /tmp draft, identical content)
- Baseline: garovartabedian @ 6499ef8e (master, clean)
- Reviewer: fresh-context native subagent (no parent conversation/memory), 2026-11-09
- Verdict: ready-with-fixes. Completion verified: reviewer cited and opened the full reading list plus public/angels JSON and EncountersRoom/FallRoom anchors.

## Blockers (all accepted by lead, verified against source)

1. Grade inheritance impossible for teaching/encounter stops (only FallStep/OrderBand carry `evidence`). Fix: badges only on fall/order stops; teaching/encounter stops render no badge; era framing keeps its own badged EvidenceNote.
2. Prop flow understated: AngelsHome needs new `fall` and `encounters` props from page.tsx. Named explicitly.
3. Unresolved-key fallback undefined. Fix: resolution returns null; component skips the stop; unit test asserts no shipped stop is unresolved, so runtime path is unreachable in practice.
4. No record-key unions exist (keys are plain strings, JSON loaded via `as` casts). Fix: dropped claim; JSON-reading unit test is the sole key-safety net.

## Improvements (accepted)

- h1 rule cited to render acceptance, not world-registry test.
- Placement decided: after StartHere, before #order-ladder (removed "undecided").
- Anchors specified: fall `/angels/fall#<step-id>`, encounter `/angels/encounters#enc-<REF with non-alnum -> ->`, band same-page `#band-<id>`.
- Chronology convention: era order is story-order; stops within an era are thematic, not canonical chronology. Test asserts era id sequence.
- Era titles fixed in plan (see plan table).
- ACT 16:16-18 in era 5 framed as Acts-record history, never as evidence of current practice.
