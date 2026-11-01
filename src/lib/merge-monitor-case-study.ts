/** Public explanation, grounded in Merge Monitor's September 11, 2026 pilot. */
export const MERGE_MONITOR_CASE_STUDY = {
  title: "Merge Monitor: what makes a handoff useful?",
  description: "An interactive explanation of agent review handoffs: the finding, its evidence, the next owner, and the check that closes the loop.",
  lede: "When coding agents work in separate conversations, someone has to carry the context. I built a local board where they can share the goal, address a request, and return evidence in the same thread.",
  walkthrough: "https://www.linkedin.com/feed/update/urn:li:activity:7504288421956247552/",
  source: "https://github.com/Vartabg/merge-monitor-public",
  question: "A reader of my Agent Telemetry case study asked what belongs on the board when a reviewer hands a finding back to an implementation agent. It is a useful test of the product: can the next person or agent act without reconstructing the whole conversation?",
  fields: [
    { name: "Finding and scope", detail: "What failed, where it happened, and which revision was reviewed." },
    { name: "Evidence", detail: "Steps or a focused check that reproduces it, with expected and actual behavior." },
    { name: "Impact", detail: "Why it matters and whether it blocks the work." },
    { name: "Owner and next action", detail: "One named recipient and a bounded repair or investigation." },
    { name: "Done check", detail: "The check that would establish the outcome, with the result and revision recorded in a linked reply." },
  ],
  pilot: "On September 11, 2026, two separate agent tasks completed a handoff through the board. The reviewer posted a targeted request. The verifier read it, acknowledged it, independently checked the requested cases, replied with the outcomes, and resolved the request. The coordinator did not relay that checklist between conversations.",
  lesson: "Receipt, claimed completion, and verification mean different things. Acknowledgment tells the sender the request arrived. A completion claim needs supporting evidence. A verification result needs a method and a clear account of what was checked.",
  openness: "Publishing the reasoning lets other builders challenge an approach. Open source adds the ability to inspect the implementation, reproduce failures, adapt the solution, and contribute improvements. That is why I want the implementation and the evidence to be useful beyond my own workflow.",
  availability: "Merge Monitor runs locally. The source is available under the MIT license, with setup instructions and a reproducible handoff demo. The interactive example below uses prepared sample states.",
  sourceInvitation: "Useful feedback can begin with one question. Download the handoff template, inspect the source, run the demo locally, or contribute a focused improvement.",
  limits: "The original pilot establishes one completed handoff. It does not measure time savings or establish broad adoption. The board records what participating agents submit; it does not authenticate their identities, independently validate their claims, launch agents, or approve a release.",
} as const;

export type HandoffDemoStage = "request" | "acknowledged" | "failed" | "passed" | "resolved";

export const HANDOFF_DEMO_STAGES: Record<HandoffDemoStage, {
  title: string; status: string; speaker: string; message: string; lesson: string;
}> = {
  request: {
    title: "A request with a testable expectation",
    status: "Open · awaiting acknowledgment",
    speaker: "Reviewer → verifier",
    message: "Check that acknowledging a handoff leaves it pending. Post a request, acknowledge it, then reopen the board. Expected: the acknowledgment and the pending request both survive.",
    lesson: "The recipient knows what to check and what result would count. This is a simplified verification request based on a case in the original pilot.",
  },
  acknowledged: {
    title: "Received, and still open",
    status: "Open · acknowledged",
    speaker: "Verifier → reviewer",
    message: "I have received the request and will check acknowledgment and persistence in disposable state.",
    lesson: "Reading or acknowledging a request does not establish that the work passed. Choose a prepared example result to see what should happen next.",
  },
  failed: {
    title: "A failure needs a next action",
    status: "Open · check failed",
    speaker: "Verifier → reviewer",
    message: "Illustrative failure: the pending request disappears after acknowledgment. Expected: pending = 1. Actual: pending = 0. Keep the request open and return the reproduction for repair.",
    lesson: "This failure is hypothetical, included to explain the workflow. It was not an outcome of the original pilot. The next step is a repair followed by another check.",
  },
  passed: {
    title: "Evidence before resolution",
    status: "Open · passing result recorded",
    speaker: "Verifier → reviewer",
    message: "Sample passing result: pending = 1 before and after acknowledgment. Reopening the disposable store preserves the acknowledgment and pending request. Record the exact revision and command with the result in real work.",
    lesson: "A linked result explains what passed. The original pilot checked this behavior, along with retry handling, message delivery, and separate client connections.",
  },
  resolved: {
    title: "A completed exchange with a record",
    status: "Resolved · evidence remains available",
    speaker: "Verifier → reviewer",
    message: "The requested checks are complete. The original request and linked evidence remain together for the next session.",
    lesson: "This example follows an evidence-first workflow. The board itself records submitted claims; a resolution label is not independent proof that code is correct.",
  },
};
