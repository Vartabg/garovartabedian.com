import type { Metadata } from "next";
import { ButtonAnchor, ButtonLink } from "@/app/_components/Button";
import CleanChrome from "../../_components/CleanChrome";
import { CONTACT_METHOD_BY_ID } from "@/lib/portfolio-content";

const mailtoHref = `${CONTACT_METHOD_BY_ID.email.href}?subject=${encodeURIComponent(
  "JobPilot case study",
)}`;

export const metadata: Metadata = {
  title: "JobPilot — ATS-first application copilot",
  description:
    "Case study for JobPilot, an open-source, human-in-the-loop application pipeline built with Python, Playwright/CDP, SQLite, and public ATS integrations.",
};

const WORKFLOW = [
  {
    name: "Source",
    note: "Read public Greenhouse, Lever, and Ashby boards so the job search starts at the company-owned application surface.",
  },
  {
    name: "Score",
    note: "Rank roles against a configurable policy, role-function fit, location gates, skill overlap, and work-style signals.",
  },
  {
    name: "Draft",
    note: "Generate resume and answer drafts from a verified account bank, with AI only as a rewrite layer when a backend is available.",
  },
  {
    name: "Track",
    note: "Keep queue, application history, status, and manual logs in local SQLite-backed state so duplicate work is visible.",
  },
  {
    name: "Review",
    note: "Produce paste-ready artifacts for a normal browser session. JobPilot helps prepare the application; the human submits it.",
  },
];

const STACK = [
  {
    name: "CLI",
    note: "Python with Typer and Rich: profile setup, scan, score, resume, queue, log, doctor, and answer commands.",
  },
  {
    name: "ATS reads",
    note: "Public Greenhouse, Lever, and Ashby endpoints normalized into one queue model before scoring.",
  },
  {
    name: "Browser layer",
    note: "Playwright and Chrome DevTools Protocol where browser context is useful, with submission kept outside automated control.",
  },
  {
    name: "Evidence",
    note: "A true-accounts bank grounds application answers so drafts do not invent metrics, titles, customers, or experience.",
  },
  {
    name: "Local state",
    note: "SQLite and JSON files keep profile, queue, applications, policy, and work-style data on the user's machine.",
  },
  {
    name: "AI routing",
    note: "Optional Gemini or local LLM support improves summary and answer wording; the non-AI path still works from templates.",
  },
];

const WORK_SIGNALS = [
  {
    name: "Customer workflow sense",
    note: "The product starts from the user's painful, repetitive workflow and turns it into a clear path: find, score, draft, track, submit.",
  },
  {
    name: "Integration judgment",
    note: "It deals with real third-party systems and their limits instead of a toy API: ATS boards, browser sessions, local files, and user policy.",
  },
  {
    name: "Human-in-loop design",
    note: "The system draws a bright line around the risky step. Automation drafts; the person reviews and submits.",
  },
  {
    name: "Field-tested pivots",
    note: "Automated live-form submission was rejected after ATS spam signals made the risk obvious. The product moved to paste-ready review artifacts.",
  },
];

const BOUNDARIES = [
  "No paid users, revenue, or enterprise adoption claimed.",
  "No auto-submit claim: JobPilot keeps the human responsible for the final application.",
  "macOS-first today; Windows and Linux are not promised as shipped.",
  "Personal policy, profile, resume, queue, and application data stay local and are gitignored.",
];

export default function WorkJobPilot() {
  return (
    <CleanChrome activeHref="/work">
      <p className="kicker">Work / Case study</p>
      <h1>JobPilot — ATS-first application copilot</h1>
      <p className="lede">
        JobPilot is the system I built for the job-search problem I was living:
        too many postings, too much repeated form work, and too much room for
        sloppy automation to make things worse. It finds company-owned ATS
        roles, scores fit, drafts tailored materials, tracks the queue, and
        keeps the final submission in human hands.
      </p>

      <p className="cta-row">
        <ButtonAnchor
          variant="primary"
          href="https://github.com/Vartabg/jobpilot"
          target="_blank"
          rel="noopener noreferrer"
        >
          View source on GitHub
        </ButtonAnchor>
        <ButtonAnchor variant="ghost" href={mailtoHref}>
          Ask about JobPilot
        </ButtonAnchor>
      </p>

      <h2>Why I built it</h2>
      <p>
        The application process is a workflow problem before it is a motivation
        problem. A good role can hide in a noisy queue; a strong answer can
        turn into copy-paste sludge; a tailored resume can take long enough
        that the user stops applying altogether.
      </p>
      <p>
        JobPilot turns that mess into a pipeline. It does the repetitive work
        a computer is good at, then stops where human judgment matters. That is
        the product point and the portfolio point: I can take an ambiguous,
        customer-facing workflow, find the real constraints, build the system,
        and say plainly where the boundary is.
      </p>

      <h2>What it does</h2>
      <ul className="contact-list">
        {WORKFLOW.map((item) => (
          <li key={item.name}>
            <span className="label">{item.name}</span>
            <span className="value">{item.note}</span>
          </li>
        ))}
      </ul>

      <h2>How it&rsquo;s built</h2>
      <p>
        The repo is a practical Python product, not a slide. It has install
        paths, CLI commands, tests, a local data model, browser integration, and
        docs for non-programmers and helpers.
      </p>
      <ul className="contact-list">
        {STACK.map((item) => (
          <li key={item.name}>
            <span className="label">{item.name}</span>
            <span className="value">{item.note}</span>
          </li>
        ))}
      </ul>

      <h2>What it demonstrates for client work</h2>
      <p>
        The useful work lives between a person&rsquo;s messy reality and a
        system&rsquo;s technical limits. JobPilot demonstrates that motion:
        translate the workflow, integrate outside systems, build the useful
        tool, and keep the risk boundary clear.
      </p>
      <ul className="contact-list">
        {WORK_SIGNALS.map((item) => (
          <li key={item.name}>
            <span className="label">{item.name}</span>
            <span className="value">{item.note}</span>
          </li>
        ))}
      </ul>

      <h2>What changed after real use</h2>
      <p>
        The early temptation was to make the browser do everything. That was
        the wrong product instinct for live application forms. ATS anti-spam
        systems can detect automated browsers, fresh profiles, repeated loads,
        and instant bulk fills. So the product moved to the reliable shape:
        source, score, draft, generate a paste sheet, then let the person
        submit from their normal browser.
      </p>
      <p>
        That decision is the kind of engineering judgment I want visible. A
        useful system is not the one that automates the most; it is the one
        that gets the user to the outcome without creating a larger risk.
      </p>

      <h2>Truth boundaries</h2>
      <ul className="contact-list">
        {BOUNDARIES.map((item) => (
          <li key={item}>
            <span className="label">Boundary</span>
            <span className="value">{item}</span>
          </li>
        ))}
      </ul>

      <h2>Where to look</h2>
      <p>
        Start with the README, then read the application-flow doc and the queue
        builder if you want the product judgment. The source is public and MIT
        licensed.
      </p>
      <p className="cta-row">
        <ButtonAnchor
          variant="primary"
          href="https://github.com/Vartabg/jobpilot"
          target="_blank"
          rel="noopener noreferrer"
        >
          View source on GitHub
        </ButtonAnchor>
        <ButtonLink variant="ghost" href="/work/eye">
          Read the EYE case study
        </ButtonLink>
      </p>
    </CleanChrome>
  );
}
