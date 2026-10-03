import type { Metadata } from "next";
import { ButtonAnchor, ButtonLink } from "@/app/_components/Button";
import CleanChrome from "../../_components/CleanChrome";
import { CONTACT_METHOD_BY_ID } from "@/lib/portfolio-content";

const mailtoHref = `${CONTACT_METHOD_BY_ID.email.href}?subject=${encodeURIComponent(
  "Agent Telemetry case study",
)}`;

export const metadata: Metadata = {
  title: "Agent Telemetry — Closed-loop governance across 44,000+ turns",
  description:
    "Case study on autonomous agent telemetry, the Thrash Index, and closed-loop memory governance built across 434 sessions in Claude Code, OpenAI Codex, Antigravity, and Cursor.",
};

const WORKFLOW = [
  {
    name: "Harvest",
    note: "Involuntarily extract raw session logs and SQLite stores from Claude Code, OpenAI Codex, Antigravity, and Cursor via macOS background daemons without developer memory burden.",
  },
  {
    name: "Normalize",
    note: "Stream heterogeneous vendor schemas into a single unified JSONL format tracking tokens, tool executions, chain-of-thought steps, and message turns.",
  },
  {
    name: "Measure",
    note: "Calculate the Thrash Index (TI) to quantitatively score session efficiency, tool failure rates, and model flailing before human fatigue sets in.",
  },
  {
    name: "Cluster",
    note: "Map user friction signals (reverts, undo commands, broken layouts, CI failures) into 5 deterministic root failure categories.",
  },
  {
    name: "Enforce",
    note: "Auto-synthesize concise 1-line behavioral rules and promote them directly into AGENTS.md and CLAUDE.md to prevent repeat failures.",
  },
];

const STACK = [
  {
    name: "Forensics Engine",
    note: "Python 3.12, SQLite3 read-only URI drivers, streaming JSONL parsers, and regex-driven failure clustering.",
  },
  {
    name: "Involuntary Daemons",
    note: "macOS launchd plists running memory-autopilot and telemetry harvesting every 30 minutes with zero cloud latency.",
  },
  {
    name: "Review Interface",
    note: "Non-blocking CLI review banner (work-brief) with shift-aware macOS text-to-speech audio for night-shift development.",
  },
  {
    name: "Task Governance",
    note: "Strict git worktree isolation (agent-task harness), automated unit verification, and clean-room privacy guarantees.",
  },
  {
    name: "Rule Synthesizer",
    note: "Deterministic rule extraction (synthesize_rules.py) converting high-thrash patterns into live system prompt constraints.",
  },
];

const WORK_SIGNALS = [
  {
    name: "Systems & FDE judgment",
    note: "Reverse-engineered undocumented local storage formats across 4 commercial agent ecosystems to build an observable telemetry plane.",
  },
  {
    name: "Closed-loop memory design",
    note: "Solved the core limitation of frontier coding models: individual capability without cross-session operational memory.",
  },
  {
    name: "Cognitive accessibility",
    note: "Built around ADHD and executive function realities: ambient audio briefings, 5-second auto-skip prompts, zero manual logging.",
  },
  {
    name: "Clean-room data ethics",
    note: "Strict isolation between sensitive developer session logs (kept local/gitignored) and clean synthetic test suites.",
  },
];

const METRICS = [
  { label: "Analyzed Sessions", value: "434" },
  { label: "Message Turns", value: "44,768" },
  { label: "Tool Invocations", value: "25,270" },
  { label: "Friction Clustered", value: "133 incidents" },
];

const BOUNDARIES = [
  "Local workstation harness, not a multi-tenant commercial SaaS product.",
  "macOS-native implementation using launchd and local system primitives; Linux/Windows parity is not promised as shipped.",
  "Developer session transcripts, tokens, and prompt logs remain 100% private in local storage.",
  "Governance rules constrain agent behavior; human developer retains final code review and push responsibility.",
];

export default function WorkAgentTelemetry() {
  return (
    <CleanChrome activeHref="/work">
      <p className="kicker">Work / Case study</p>
      <h1>Agent Telemetry — Closed-loop memory &amp; governance</h1>
      <p className="lede">
        Across 434 multi-turn sessions in Claude Code, OpenAI Codex,
        Antigravity, and Cursor, autonomous coding models repeatedly failed in
        the same five ways. This case study documents an involuntary telemetry,
        Thrash Index, and rule-synthesis engine built to turn developer friction
        into deterministic behavioral constraints.
      </p>

      <p className="cta-row">
        <ButtonLink variant="primary" href="/services">
          Work with Garo
        </ButtonLink>
        <ButtonAnchor variant="ghost" href={mailtoHref}>
          Discuss Agent Governance
        </ButtonAnchor>
      </p>

      <h2>The numbers across 4 ecosystems</h2>
      <div className="cards">
        {METRICS.map((m) => (
          <article className="card" key={m.label}>
            <h3>{m.value}</h3>
            <p>{m.label}</p>
          </article>
        ))}
      </div>

      <h2>Why I built it</h2>
      <p>
        Working full-time with autonomous coding agents reveals a consistent
        pattern: model capabilities are remarkable, but cross-session operational
        memory is zero. An agent that breaks UI touch targets or creates Next.js
        hydration loops at 2:00 PM will make that exact same mistake at 8:00 PM
        in a fresh session.
      </p>
      <p>
        Manual prompt engineering and constant supervision cause severe cognitive
        fatigue. I needed a system that observed every model turn invisibly,
        quantified when the model was flailing in unproductive loops, and
        automatically extracted permanent constraints to protect the codebase.
      </p>

      <h2>The closed-loop lifecycle</h2>
      <ul className="contact-list">
        {WORKFLOW.map((item) => (
          <li key={item.name}>
            <span className="label">{item.name}</span>
            <span className="value">{item.note}</span>
          </li>
        ))}
      </ul>

      <h2>The Thrash Index (TI)</h2>
      <p>
        To detect when an agent is flailing rather than making progress, the
        pipeline calculates the Thrash Index: the ratio of failed tool
        executions, user interventions, and file rollbacks relative to total
        session turns.
      </p>
      <p>
        Sessions scoring above 15% indicate severe context exhaustion or prompt
        derailment. Rather than continuing to burn tokens on speculative
        repairs, the system triggers automated session compaction and alerts the
        developer.
      </p>

      <h2>How it&rsquo;s built</h2>
      <ul className="contact-list">
        {STACK.map((item) => (
          <li key={item.name}>
            <span className="label">{item.name}</span>
            <span className="value">{item.note}</span>
          </li>
        ))}
      </ul>

      <h2>What it demonstrates for engineering teams</h2>
      <ul className="contact-list">
        {WORK_SIGNALS.map((item) => (
          <li key={item.name}>
            <span className="label">{item.name}</span>
            <span className="value">{item.note}</span>
          </li>
        ))}
      </ul>

      <h2>Boundaries &amp; honest non-claims</h2>
      <ul className="contact-list">
        {BOUNDARIES.map((item) => (
          <li key={item}>
            <span className="value">{item}</span>
          </li>
        ))}
      </ul>
    </CleanChrome>
  );
}
