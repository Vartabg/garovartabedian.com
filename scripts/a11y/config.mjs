export const routes = [
  "/",
  "/jesus",
  "/jesus/words",
  "/jesus/life",
  // The appearance grid is the densest table on the site — gated so the
  // sticky row headers and cell links can't regress out of reach.
  "/jesus/risen",
  // These four rooms carry their own hard-coded colours and drawings; Gospels
  // word by word lost its title on the ivory theme while none of them was audited.
  "/jesus/harmony",
  "/jesus/prophecy",
  "/jesus/history",
  "/jesus/lens",
  // Expandable passages with per-Gospel panels and Greek toggles.
  "/jesus/parables",
  // Open a comparison to audit its noncanonical Thomas links and label.
  "/jesus/parables#parable-wicked-tenants",
  "/jesus/parables#parable-thomas-empty-jar",
  "/jesus/parables#parable-john-vine-branches",
  "/jesus/parables#parable-john-bread-of-life",
  "/jesus/parables#parable-synoptic-lamp",
  "/jesus/parables#parable-james-grain-wheat",
  "/jesus/parables#parable-james-foreigners",
  "/jesus/parables#parable-hermas-elm-vine",
  "/jesus/parables#parable-clement-two-one",
  "/jesus/parables#parable-didache-two-ways",
  "/jesus/parables#parable-acts-thomas-prayer",
  "/jesus/parables#parable-synoptic-yoke",
  "/jesus/parables#parable-acts-thomas-tower",
  "/jesus/parables#parable-synoptic-physician-sick",
  "/jesus/parables#parable-barnabas-cornerstone",
  "/apostles",
  "/apostles/stories/come-and-eat",
  "/apostles/stories/peace-be-with-you",
  "/apostles/stories/every-language",
  "/early",
  // Dense visualizations use adjacent native selectors instead of overlapping
  // pseudo-buttons inside the drawing; audit both equivalent-control routes.
  "/early/ignatius",
  // A library reading page with the canon label: the parables room links into these one saying at a time.
  "/early/library/gospel-thomas/saying-64",
  "/early/library/secret-book-james/prophecies-and-parables#p10",
  "/church",
  "/church/councils",
  "/church/tree",
  "/angels",
  // The visual story pairs a deliberate reveal with native comparison controls.
  "/angels/stories/open-his-eyes",
  "/angels/stories",
  "/angels/stories/i-am-with-you",
  "/angels/stories/the-gate-opened",
  // Original-script headwords with lang/dir, 31 native disclosures, and
  // hundreds of verse-number links — the densest link surface in the world.
  "/angels/vocabulary",
  // The two rooms with the most small inline reference links and tinted
  // quote panels; neither was audited until their target sizes and caption
  // contrast were found failing.
  "/angels/encounters",
  "/angels/demons",
  // Dossier presets, source boundaries, export controls, and dense research
  // cards must remain operable without overflowing a phone viewport.
  "/angels/dossier?preset=watchers-nephilim-enoch",
  "/jesus/dossier?preset=resurrection-minimal-facts",
  "/word",
  // The case studies carry their own category chips and colour tokens, and
  // none of it was covered while only the world home was audited.
  "/word/cases",
  // The license-chain room: numbered step lists, shelf chips, and many
  // external links inside cards — gated so the chain stays readable.
  "/word/free",
  "/evidence",
  "/scriptures",
  "/scriptures/word-bridge",
  "/scriptures/protestant/JHN/3?t=web&study=word-bridge#v16",
  "/scriptures/search",
  "/scriptures/topics",
  // The graph page renders algorithm output as tables and link chains —
  // gated so computed data can't regress into inaccessible presentation.
  "/scriptures/graph",
  // Exact-source disclosures and downloadable investigation evidence.
  "/scriptures/investigations/isaiah-53-clement-16",
  // The chapter reader — the deepest interaction on the site, and the page a
  // reader spends the most time on. Gated so the reading surface can't regress.
  "/scriptures/protestant/JHN/3",
  // 1 Enoch — the Ethiopian-canon shelf's own text, with Charles' editorial
  // marks; gated so the non-standard corpus can't regress out of reach.
  "/scriptures/ethiopian/ENO/1",
  // Jubilees includes the parallel-study entry alongside the Charles reader.
  "/scriptures/ethiopian/JUB/18",
  // The book briefing — the context a reader gets before verse 1. Its own
  // accordions, fact grid, and debate blocks, none of it covered elsewhere.
  "/scriptures/protestant/MRK",
  // Professional paths — independent work first, employment retained.
  "/services",
  "/work",
  "/work/garovartabedian",
  "/work/job-report",
  "/work/landing-page",
  "/work/excel-handler",
  "/work/accessibility",
  "/contact",
  "/hire",
  "/labs",
  "/resume",
];

// Navigation, HTTP probing, and server readiness are separate budgets. Named
// exports keep each call site's intent explicit and independently tunable.
export const navigationTimeoutMs = 30_000;
export const probeTimeoutMs = 30_000;
export const readinessTimeoutMs = 30_000;
export const minimumLighthouseScore = 0.95;
export const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
// Explicit schemes make Axe independent of the host OS appearance. Lighthouse
// retains its existing single desktop pass and 95% accessibility threshold.
export const colorSchemes = ["light", "dark"];
// Reveal animations must be visible when audited, as in the e2e suite.
export const reducedMotionFlag = "force-prefers-reduced-motion";
