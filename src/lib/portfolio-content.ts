import { WORLD_REGISTRY } from "./world-registry";
export { ACCESSIBILITY_CASE_STUDY } from "./accessibility-case-study";

/**
 * Shared, structured portfolio content — the single substance spine every
 * version renders. Kept strictly within true_accounts.json boundaries
 * (no invented metrics/users/revenue; JobPilot = human-in-the-loop; View = first
 * responder + primary contact, not team lead; Navy = veteran only, no specifics).
 *
 * There is exactly ONE prose source (this file). No version may author copy of
 * its own — that's what keeps every "version" truthful no matter how the
 * presentation changes.
 */

export const PROFILE = {
  name: "Garo Vartabedian",
  role: "Solutions Engineer",
  tagline: "Field service engineer — now I build the tools.",
  blurb:
    "I did field service — the engineer on the customer's site when the hardware had to work. Now I build software: full-stack apps, browser automation, and API integrations in Python and TypeScript. Different toolbox, same job — show up, figure it out, make it work.",
  location: "Austin, Texas",
  veteran: true,
  // Scannable capability strip — what I do, in four plain tokens.
  capabilities: [
    "Customer-site deployment",
    "Browser & API automation",
    "Full-stack build",
    "Human-in-the-loop LLM tooling",
  ],
  links: {
    email: "garo.vartabed@gmail.com",
    phone: "718-872-8578",
    linkedin: "https://www.linkedin.com/in/garovartabedian",
    github: "https://github.com/Vartabg",
    atxbro: "https://www.atxbro.com",
    hire: "/hire",
    resume: "/resume",
    resumePdf: "/Garo-Vartabedian-Resume.pdf",
    knowledgePipelinePdf: "/Enterprise-Knowledge-Pipeline-OnePager.pdf",
  },
};

export type ContactMethodId = "email" | "phone" | "linkedin" | "github";

export type ContactMethod = {
  id: ContactMethodId;
  label: string;
  display: string;
  href: string;
  external: boolean;
};

const phoneDigits = PROFILE.links.phone.replace(/\D/g, "");
const phoneHref =
  phoneDigits.length === 10 ? `tel:+1${phoneDigits}` : `tel:+${phoneDigits}`;
const displayUrl = (url: string) =>
  url.replace(/^https?:\/\/(?:www\.)?/, "").replace(/\/$/, "");

/** Public contact methods, derived from PROFILE so labels and hrefs cannot drift. */
export const CONTACT_METHODS = [
  {
    id: "email",
    label: "Email",
    display: PROFILE.links.email,
    href: `mailto:${PROFILE.links.email}`,
    external: false,
  },
  {
    id: "phone",
    label: "Phone (text preferred)",
    display: PROFILE.links.phone,
    href: phoneHref,
    external: false,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    display: displayUrl(PROFILE.links.linkedin),
    href: PROFILE.links.linkedin,
    external: true,
  },
  {
    id: "github",
    label: "GitHub",
    display: displayUrl(PROFILE.links.github),
    href: PROFILE.links.github,
    external: true,
  },
] as const satisfies readonly ContactMethod[];

export const CONTACT_METHOD_BY_ID = Object.fromEntries(
  CONTACT_METHODS.map((method) => [method.id, method]),
) as Record<ContactMethodId, ContactMethod>;

/** Repeated action labels stay identical across every portfolio surface. */
export const ACTION_LABELS = {
  workWithGaro: "Work with Garo",
  discussProject: "Discuss a project",
  employmentProfile: "View employment profile",
  resumePdf: "Download résumé (PDF)",
  email: "Email Garo",
  caseStudy: "Read case study",
  source: "View source",
  liveDemo: "Open live demo",
  liveSite: "Visit live site",
} as const;

export type Project = {
  name: string;
  tagline: string;
  desc: string;
  stack: string[];
  href: string;
  hrefLabel: string;
  sourceHref?: string;
  sourceLabel?: string;
  /** Honest delivery state, surfaced as a badge in the Lab. */
  status?: "shipped-live" | "open-source" | "working-local";
  /** Lab: a live URL to open in a new tab — the always-available fallback. */
  demoUrl?: string;
  /** Lab: iframe src for the in-page embed (the demo deploy must allow framing). */
  embedUrl?: string;
  /** Lab: which animated cover "poster" to draw before the embed loads. */
  cover?: "graph" | "orbit";
};

export type CaseStudyItem = {
  name: string;
  note: string;
};

export const PROJECT_STATUS_LABEL: Record<
  NonNullable<Project["status"]>,
  string
> = {
  "shipped-live": "shipped live",
  "open-source": "open source",
  "working-local": "working local",
};

export const PROJECTS: Project[] = [
  {
    name: "Merge Monitor",
    tagline: "A local coordination board for AI coding agents.",
    desc: "Keeps shared goals, decisions, questions, and handoffs in one local workspace. MCP and terminal clients exchange context and record acknowledgment separately from resolution. A real pilot demonstrated a request, verification, and completed handoff between agents.",
    stack: ["React", "TypeScript", "Node.js", "MCP", "Git"],
    href: "https://www.linkedin.com/feed/update/urn:li:activity:7504288421956247552/",
    hrefLabel: "Watch walkthrough",
    status: "working-local",
  },
  {
    name: "Agent Telemetry & Memory",
    tagline: "Closed-loop telemetry and governance across 44,000+ autonomous agent turns.",
    desc: "Involuntary background extraction, friction clustering, and automated rule synthesis across Claude Code, OpenAI Codex, Antigravity, and Cursor — turning developer friction into deterministic behavioral constraints.",
    stack: ["Python", "SQLite", "macOS launchd", "Telemetry & Forensics"],
    href: "/work/telemetry",
    hrefLabel: ACTION_LABELS.caseStudy,
    status: "working-local",
  },
  {
    name: "JobPilot",
    tagline: "An ATS-first application copilot that keeps a human in the loop.",
    desc: "Scans Greenhouse, Lever, and Ashby postings, scores role fit, drafts tailored resume and answer packs from verified accounts, and tracks the queue — while a person reviews every submission.",
    stack: ["Python", "Typer", "Playwright / CDP", "SQLite"],
    href: "/work/jobpilot",
    hrefLabel: ACTION_LABELS.caseStudy,
    sourceHref: "https://github.com/Vartabg/jobpilot",
    sourceLabel: ACTION_LABELS.source,
    status: "open-source",
  },
  {
    name: "Accessibility is a product feature",
    tagline: "Making four products easier to perceive, operate, and understand.",
    desc: "A public accessibility standard, a record of concrete repairs, and a keyboard demonstration of the difference a named control and announced result make.",
    stack: ["Semantic HTML", "Keyboard access", "Axe", "CI release gates"],
    href: "/work/accessibility",
    hrefLabel: ACTION_LABELS.caseStudy,
    sourceHref: "https://github.com/Vartabg/accessibility-is-a-product-feature",
    status: "open-source",
  },
  {
    name: "garovartabedian.com",
    tagline: "An eight-world research site that doubles as engineering proof.",
    desc: "Static-friendly Next.js system for Scripture, Jesus history, the apostles, early writings, church history, angels, and evidence analysis: generated source data, NotebookLM dossier synthesis, parallel polyglot alignment, patristic commentary graphs, and browser-verified route checks.",
    stack: ["Next.js", "TypeScript", "Knowledge Pipelines", "NotebookLM Dossiers", "Vercel"],
    href: "/work/garovartabedian",
    hrefLabel: ACTION_LABELS.caseStudy,
    status: "shipped-live",
    demoUrl: "https://garovartabedian.com",
  },
  {
    name: "EYE",
    tagline: "Watch code run as a graph you can drag.",
    desc: "A visual debugger that draws execution as a live graph — calls, branches, what ran when. The public demo is a curated static sample; full local tracing runs the Python backend.",
    stack: ["Pixi.js / WebGL", "ELK layout", "React", "FastAPI tracer"],
    href: "/work/eye",
    hrefLabel: ACTION_LABELS.caseStudy,
    status: "working-local",
    demoUrl: "https://eye-code-visualizer.vercel.app",
    embedUrl: "https://eye-code-visualizer.vercel.app",
    cover: "graph",
  },
  {
    name: "atxbro.com",
    tagline: "Full-stack web products, built and shipped solo.",
    desc: "Built for my neighbors, solo — frontend, deploys, iteration, interactive 3D, long-form pieces.",
    stack: ["Next.js", "React", "Three.js / WebGPU", "Vercel"],
    href: "https://www.atxbro.com",
    hrefLabel: ACTION_LABELS.liveSite,
    status: "shipped-live",
    demoUrl: "https://www.atxbro.com",
    embedUrl: "https://www.atxbro.com",
    cover: "orbit",
  },
];

export type ResumeExperience = {
  id: string;
  period: string;
  role: string;
  organization: string;
  location?: string;
  summary: string;
  bullets: readonly string[];
};

export type ResumeEducation = {
  id: string;
  school: string;
  credential: string;
  year: string;
};

export type ResumeContent = {
  headline: string;
  summary: string;
  experience: readonly ResumeExperience[];
  education: readonly ResumeEducation[];
  technicalProofProjectNames: readonly string[];
};

/**
 * Public-safe resume facts. This is the sole employment, summary, and education
 * source for the web resume, the hire page, and the generated PDF. It is a
 * deliberately bounded projection and never imports private job-search data.
 */
export const RESUME: ResumeContent = {
  headline:
    "Software & Automation Developer · Customer-Facing Technical Delivery",
  summary:
    "Independent developer building web applications, workflow automation, and research tools in Python and TypeScript. Combines software delivery with field engineering experience commissioning customer systems, diagnosing failures, and coordinating technical handoffs. Recent work includes AI-agent coordination, human-reviewed application workflows, and source-linked knowledge tools. U.S. Navy veteran.",
  experience: [
    {
      id: "independent-developer",
      period: "May 2022 - Present",
      role: "Independent Software & Web Developer",
      organization: "Self-Employed",
      location: "Austin, TX",
      summary:
        "Build and maintain independent projects with React, Next.js, Python, TypeScript, APIs, and browser automation.",
      bullets: [
        "Merge Monitor: built a local agent coordination board with MCP and terminal access, persistent decisions, and distinct acknowledgment/resolution steps; demonstrated an agent-to-agent verification handoff.",
        "JobPilot: built a Python/SQLite workflow to ingest job postings, score fit, prepare tailored application drafts, and track the queue, with human review and submission.",
        "Research platform: shipped garovartabedian.com with generated source data, searchable texts, offline reading, and source-attributed exports for research and NotebookLM.",
        "Web products: built ATXBro and EYE; added keyboard access, semantic controls, reading preferences, and automated accessibility checks across the projects.",
        "Since December 2024, added AI and agent workflows with explicit human-review boundaries.",
      ],
    },
    {
      id: "overnight-valet",
      period: "Jul 2026 - Present",
      role: "Overnight Valet Attendant",
      organization: "Evolution Parking & Guest Services",
      location: "Courtyard & Residence Inn, Downtown Austin",
      summary: "Guest-facing overnight valet operations.",
      bullets: [],
    },
    {
      id: "independent-freelance",
      period: "2020 - 2022",
      role: "Career Transition",
      organization: "Independent",
      summary: "Began software and web development during this period.",
      bullets: [],
    },
    {
      id: "field-service",
      period: "Oct 2016 - Jul 2020",
      role: "Field Service Engineer",
      organization: "View, Inc.",
      location: "Milpitas, CA",
      summary:
        "Commissioned enterprise smart-glass deployments across the US, Canada, the UK, and the EU, including controller configuration and BMS integration.",
      bullets: [
        "Coordinated glaziers, electricians, general contractors, site staff, building managers, and customers against deployment deadlines.",
        "Handled service calls on live buildings, facilities-vendor onboarding, repair cleanup, and customer-facing product demos.",
      ],
    },
    {
      id: "sales-business-development",
      period: "2013 - 2016",
      role: "Sales & Business Development",
      organization:
        "TrimTabs Investment Research · GigaOM · Westgate · Monitronics",
      summary:
        "Sales and business-development work across investment research, technology research, timeshare, and home security.",
      bullets: [],
    },
    {
      id: "full-time-student",
      period: "2009 - 2013",
      role: "Full-Time Student",
      organization: "Queensborough Community College to Columbia University",
      location: "New York City",
      summary: "Full-time undergraduate study.",
      bullets: [],
    },
    {
      id: "customer-service",
      period: "Nov 2008 - Jun 2009",
      role: "Customer Service Engineer",
      organization: "Christie Digital",
      location: "NY / NJ / CT",
      summary:
        "Commissioned and maintained digital-cinema installs during the industry's transition from 35mm film to digital.",
      bullets: [
        "Provided direct customer support and 24/7/365 on-call coverage for live theaters.",
      ],
    },
    {
      id: "navy-electronics",
      period: "Feb 2003 - Aug 2008",
      role: "Electronics Technician",
      organization: "U.S. Navy",
      summary:
        "Electronics maintenance work and a foundation in disciplined troubleshooting.",
      bullets: [],
    },
  ],
  education: [
    {
      id: "columbia-ba",
      school: "Columbia University",
      credential: "BA, Philosophy",
      year: "2013",
    },
    {
      id: "queensborough-as",
      school: "Queensborough Community College (CUNY)",
      credential: "AS, Business Administration",
      year: "2011",
    },
  ],
  technicalProofProjectNames: ["Merge Monitor", "JobPilot", "garovartabedian.com"],
};

export const WORK_PAGE = {
  kicker: "Work",
  headline: "Systems you can inspect.",
  lede:
    "Case studies showing how I turn ambiguous workflows, dense information, and difficult interfaces into tools people can use — with source, live demos, and honest boundaries where each project supports them.",
  proofLine:
    "Start with JobPilot for workflow automation and human-review boundaries; then open this research platform for product architecture, data discipline, source provenance, and verified shipping.",
};

export const SITE_CASE_STUDY = {
  kicker: "Work / Case study",
  title: "garovartabedian.com — a self-funded research platform",
  description:
    "Case study for garovartabedian.com, a self-funded Next.js research platform with generated scripture data, source provenance, static-friendly routes, and verified UI passes.",
  lede:
    "I fund and maintain this passion project myself; it was not commissioned by a client. It is a live research platform: eight connected worlds, generated source data, source provenance, visual systems, and a shipping workflow that leaves the work verified, committed, pushed, and clean.",
  facts: [
    {
      name: "Surface",
      note: "Eight connected research worlds: Scriptures, Jesus, The Apostles, The Writings, Church, Angels & Demons, Who Owns the Word?, and How We Know — plus the tools and source trail that make them usable.",
    },
    {
      name: "Core stack",
      note: "Next.js App Router, React, TypeScript, static JSON data, generated sitemap, and Vercel deployment.",
    },
    {
      name: "Data shape",
      note: "Public-domain scripture texts, canon metadata, cross-references, search shards, Nave topics, early writings, church road data, and source records live as inspectable structured files.",
    },
    {
      name: "Proof standard",
      note: "No traffic, revenue, adoption, or public-source claims. The visible proof is the live site, the source trail, the route behavior, and the verification record.",
    },
  ] satisfies CaseStudyItem[],
  architecture: [
    {
      name: "World architecture",
      note: "Each world owns its own layout, navigation, palette, and source posture, while shared guide data keeps orientation and next-step links consistent.",
    },
    {
      name: "Static-first delivery",
      note: "Research content is served from generated JSON and App Router pages so the site remains fast, crawlable, and deployable without a database.",
    },
    {
      name: "Client islands where needed",
      note: "Interactive readers, maps, timelines, ladders, search, and visual systems load client-side only where the user experience needs them.",
    },
    {
      name: "SEO and discovery",
      note: "Metadata, JSON-LD, canonical routes, robots, and sitemap entries expose the worlds, case studies, source page, canon shelves, and hosted early texts.",
    },
  ] satisfies CaseStudyItem[],
  dataPipeline: [
    {
      name: "Scripture pipeline",
      note: "A Node pipeline downloads source files under their recorded licenses, normalizes book codes, emits verse JSON, cross-references, search shards, canon data, and a source manifest.",
    },
    {
      name: "Topic index",
      note: "Nave's Topical Bible is parsed into topic JSON, then references and internal topic links are checked before they become reader links.",
    },
    {
      name: "Content boundaries",
      note: "Modern copyrighted translations are discussed in the ownership room but not hosted as scripture text.",
    },
    {
      name: "Static loaders",
      note: "Shared JSON loaders cache fetches by path, so client rooms can load their data without duplicating fetch/cache behavior.",
    },
  ] satisfies CaseStudyItem[],
  credibility: [
    {
      name: "Source registry",
      note: "A shared source-guidance module powers the human /sources page and the compact source-basis blocks on high-claim pages.",
    },
    {
      name: "Claim locality",
      note: "The pages keep links near the claims they support: rights-holder pages, public-domain translations, court records, artifacts, primary texts, and hosted scripture refs.",
    },
    {
      name: "Wayfinding",
      note: "World guides tell readers what kind of sources each room uses before they scroll into the detailed records.",
    },
  ] satisfies CaseStudyItem[],
  verification: [
    {
      name: "Required checks",
      note: "Source changes run lint, TypeScript, and production build before shipping.",
    },
    {
      name: "Route/UI checks",
      note: "Visual route changes get a local dev-server browser pass for content, source links, framework overlays, console/page errors, and mobile overflow.",
    },
    {
      name: "Git discipline",
      note: "Completed passes are staged deliberately, committed with a scoped message, pushed to the upstream branch, and checked for a clean worktree.",
    },
  ] satisfies CaseStudyItem[],
  scholarshipSuite: [
    {
      name: "Universal NotebookLM Dossier Engine",
      note: "Generates structured, multi-source Markdown research worksheets with YAML frontmatter, named source notes, and thematic prompts for Google NotebookLM source ingestion and Audio Overviews.",
    },
    {
      name: "The Living Digital Hexapla",
      note: "A parallel textual alignment engine synchronizing named Hebrew or Greek editions with Brenton, Douay-Rheims, King James, and World English Bible translations, with zero runtime database dependencies.",
    },
    {
      name: "Computational Catena Aurea",
      note: "A dense commentary graph linking scripture verses directly to patristic and classical witnesses, parsed into structured static JSON.",
    },
    {
      name: "Diachronic Semantic Evolution",
      note: "Interactive tracking of lexical drift and conceptual shifts across millennia of textual history, tracing how root meanings evolved through cultural eras.",
    },
    {
      name: "Polyphonic Disputation Engine",
      note: "A structured dialectical debate model rendering classical theological disputes as navigable argument-rebuttal trees with cited historical positions.",
    },
  ] satisfies CaseStudyItem[],
  enterpriseBridge: [
    {
      name: "Solving the 'Garbage In, Garbage Out' barrier",
      note: "Google NotebookLM and enterprise LLMs can produce errors when source material is messy or incomplete. The pipeline patterns developed here for ancient multilingual texts translate to corporate data: OCR cleanup, structured chunking, provenance notes, and reviewable dossier synthesis.",
    },
    {
      name: "Complex multi-source reconciliation",
      note: "Just as ancient polyglots align contradictory variants across Hebrew, Greek, and Latin, enterprise operations require reconciling disparate data models across ERPs, CRM tickets, SOP manuals, and vendor contracts.",
    },
    {
      name: "Audit-grade provenance and claim locality",
      note: "The research worksheets name their hosted editions and cited works, label editorial notes, and ask readers to verify interpretive claims against the cited source before reuse.",
    },
    {
      name: "Zero-dependency static architectures",
      note: "Complex knowledge systems do not always require brittle, expensive vector databases. High-density, pre-compiled static indexes deliver instant, serverless, and recruiter-safe reliability.",
    },
  ] satisfies CaseStudyItem[],
  boundaries: [
    "I fund and maintain this passion project myself; it was not commissioned by a client.",
    "The repository is private, so this case study does not present a public source-code link.",
    "The site is a live product artifact, not evidence of traffic, revenue, customers, or adoption.",
    "Hosted Scripture uses public-domain translations and attributed original-language editions under their recorded licenses; copyrighted modern translations are analyzed but not reproduced as hosted Scripture.",
    "Generated imagery and visual systems support the experience, but factual claims must still sit beside source links.",
  ],
};

export const HIRE_PAGE = {
  kicker: "For hiring teams",
  headline: "Solutions Engineer who can own the messy middle.",
  quickFacts: [
    { label: "Location", value: PROFILE.location },
    {
      label: "Role lane",
      value: "Solutions, Implementation, Customer Engineering",
    },
    {
      label: "Background",
      value: "U.S. Navy veteran; field service engineer; builder",
    },
    {
      label: "Best fit",
      value: "Small teams where customer-facing technical ownership matters",
    },
  ],
  signals: [
    {
      label: "Target roles",
      value:
        "Solutions Engineer, Implementation Engineer, Customer Engineer, and technical support roles where customer reality meets product truth.",
    },
    {
      label: "Strongest proof",
      value:
        "JobPilot: a public, human-in-the-loop Python pipeline for ATS sourcing, fit scoring, tailored materials, local state, and honest automation boundaries. This site: a live Next.js research system with generated data, source provenance, and verified route/UI passes.",
    },
    {
      label: "Customer-site proof",
      value:
        "Field service engineer for enterprise hardware deployments across the US, Canada, the UK, and the EU; BMS integration, commissioning, demos, live-site service calls.",
    },
    {
      label: "Build stack",
      value:
        "Python, TypeScript, Next.js, React, Playwright/CDP, SQLite, API integrations, browser automation, and human-in-the-loop LLM tooling.",
    },
  ],
  translation: [
    {
      label: "I have lived the handoff",
      value:
        "The field-service years were customer site, trade coordination, commissioning, service calls, and demos under live deadline pressure.",
    },
    {
      label: "I keep automation honest",
      value:
        "JobPilot automates sourcing, scoring, and drafting, but keeps human review before submission as a design boundary.",
    },
    {
      label: "I can show the work",
      value:
        "The proof is public where possible: case studies, live demos, and source links instead of inflated metrics.",
    },
  ],
};

/** Faith statement — open, per Garo's wish. Public-domain scripture (WEB). */
export const FAITH = {
  verse: "Why are you so afraid? How is it that you have no faith?",
  ref: "Mark 4:40",
};

/** Why the site and the work around it exist. */
export const ABOUT_PAGE = {
  kicker: "About this work",
  title: "Why I built all of this.",
  description:
    "Why Garo Vartabedian built this site: to put Jesus Christ at the center, make the record easier to enter and examine, and hand useful tools to the next person.",
  lede:
    "I’m trying to love God with all I’ve got and love my neighbor as myself. This site is one way I know to do that: open the text, follow the record, show the sources, and build the help I needed so the next person can use it too.",
  centerHeading: "Put Jesus at the center",
  centerCopy: [
    "The center of this site is Jesus Christ. I wanted one place where a person could read his words, walk through his life, examine the witnesses, and open the Scriptures that tell the story — without needing to know where to begin.",
    "That is why this became more than a Bible reader or a collection of essays. Scripture, history, the apostles, the early writings, the church, angels and demons, Bible ownership, and the question of how we know things all belong to the same search. The worlds keep their differences, but they lead back to the same center.",
  ],
  methodHeading: "Make the trail visible",
  methodCopy: [
    "I did not want to hand people conclusions with the scaffolding removed. Claims should show what supports them. Difficult questions, disagreements, rights, interpretations, and limits should stay in view. If a source can be opened, it should be close to the claim it supports.",
    "I also wanted the record to feel enterable. I learn by seeing how parts connect, not by staring at a wall of text. So these subjects became rooms, maps, timelines, readers, cross-references, and guided paths: something to walk through, not just scroll past.",
  ],
  workHeading: "Build the help I needed",
  workCopy: [
    "That same reason runs through the other work. EYE makes code execution visible because that was the way I needed to learn it. JobPilot turns a job search I was living into a human-in-the-loop workflow. The projects differ, but the motion is the same: take something confusing, repetitive, or closed off; understand the system; make a useful path through it; then hand that path to someone else.",
    "This site is also honest proof that I can do the work. I came to software by a non-traditional route, so I chose to show the product, the sources, the decisions, and the boundaries instead of asking anyone to take a claim on faith. The portfolio matters, but the work has to be useful before it is proof.",
  ],
  publicHeading: "A public project, not a product pitch",
  publicCopy: [
    "This site is a self-funded passion project and a free public resource. I am not asking anyone to pay for access to the research or the Scripture tools here.",
    "The research remains free and its purpose does not change. Professional work is offered separately: this project shows how I approach source-heavy systems, product architecture, unusual interfaces, and long-running delivery.",
  ],
  builderHeading: "About the builder",
  builderLede:
    "I did field service — the engineer on the customer’s site when the hardware had to work. Now I build software. Different toolbox, same habit: show up, understand the system, make it work, and leave something useful behind.",
};

/**
 * The content-first homepage: Jesus is the direct subject, Scripture is
 * immediately usable, and the remaining worlds follow the shape of the record.
 * Employment material remains available without leading the front door.
 */
export const HOME = {
  worldsLabel: "Scripture · History · Witness",
  worldsHeading: "Jesus Christ.",
  // Says what the site is. Garo's own sentence from the About page, trimmed of
  // its first-person opening with his approval (2026-10-03).
  heroText:
    "One place to read his words, walk through his life, examine the witnesses, and open the Scriptures that tell the story — without needing to know where to begin.",
  primaryHref: "/jesus/words",
  primaryLabel: "Read his words",
  scriptureHref: "/scriptures",
  scriptureLabel: "Open the Scriptures",
  worldsHref: "#worlds",
  worldsLinkLabel: "Explore the whole record",
  // The builder's line above the headline — Garo's spot and words (2026-10-03),
  // so an engineer can tell from the first screen that this is a built project.
  builderLead: "A portfolio project by",
  builderLinkLabel: "How it's built",
  builderHref: "/work/garovartabedian",
  scriptureHeading: "The text itself.",
  // The heading over all eight worlds. It is where "Explore the whole record"
  // on the first screen lands, so the two read the same (2026-10-03).
  pathsHeading: "The whole record.",
  investigationsLabel: "Investigate further",
  investigationsHeading: "Three records that refuse easy answers.",
  webNote: "Scripture quotations are from the World English Bible — public domain.",
};

/**
 * The eight worlds — the dive the site opens into. Each door carries its
 * world's own palette so the threshold previews the room beyond it.
 */
export const WORLDS = {
  intro:
    "Scripture, history, art, and the facts of who owns them — built to be walked through, not scrolled past.",
  doors: WORLD_REGISTRY.map((world) => ({
    id: world.id,
    title: world.label,
    line: world.description,
    href: world.href,
    bg: world.bg,
    ink: world.ink,
    accent: world.accent,
    image: world.image,
  })),
};
