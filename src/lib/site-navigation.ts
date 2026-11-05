import { WORLD_REGISTRY, type WorldId } from "./world-registry";

export type SiteLink = {
  href: string;
  label: string;
  note?: string;
};

type SiteRoute = SiteLink & {
  /** A real, navigable parent; URL segments alone do not imply a parent page. */
  parent?: string;
  presentation?: "reader";
};

/** Public destinations, shared by wayfinding and the section page indexes. */
export const SITE_ROUTES: readonly SiteRoute[] = [
  { href: "/", label: "Home", note: "Choose a world or learn about the work." },
  ...WORLD_REGISTRY.map((world) => ({
    href: world.href,
    label: world.label,
    note: world.description,
    parent: "/",
  })),
  { href: "/scriptures/stories", label: "Stories", note: "Read a story that runs through many chapters, in the words of the text.", parent: "/scriptures" },
  { href: "/scriptures/search", label: "Search the text", note: "Search Scripture and early writings, or open a reference." },
  { href: "/scriptures/word-bridge", label: "Word Bridge", note: "Connect English words with Hebrew and Greek, dictionary entries, and grammar." },
  { href: "/scriptures/topics", label: "Bible topics", note: "Follow a subject into its Scripture references." },
  { href: "/scriptures/canons", label: "Canons & traditions", note: "Compare the books received by each tradition." },
  { href: "/scriptures/polyglot", label: "Compare translations", note: "Read source-language witnesses alongside translations." },
  { href: "/scriptures/catena", label: "Catena · early readers", note: "Follow early Christian readings of a passage." },
  { href: "/scriptures/graph", label: "Cross-reference graph", note: "Explore connections between Scripture passages." },
  { href: "/scriptures/parallels", label: "Parallel claims", note: "Compare claims across Abrahamic source traditions." },
  { href: "/scriptures/resonance", label: "Conceptual resonance", note: "Compare related concepts across source traditions." },
  { href: "/scriptures/diachronic", label: "Words through time", note: "Trace how selected sacred terms are used across eras." },
  { href: "/scriptures/disputation", label: "Biblical debates", note: "Inspect different readings of a biblical question." },
  { href: "/scriptures/dossier", label: "Build a research dossier", note: "Gather named editions and source notes into a portable research worksheet." },
  { href: "/scriptures/read/isaiah-53-clement-16", label: "Wounds, healing, and humility", note: "Read Isaiah 53 and 1 Clement 16 along a guided path.", parent: "/scriptures" },
  { href: "/scriptures/investigations/isaiah-53-clement-16", label: "Isaiah 53 in 1 Clement 16", note: "Inspect the sources behind this reception claim.", parent: "/scriptures" },
  { href: "/jesus/words", label: "His words", note: "Read Gospel sayings with their Scripture context." },
  { href: "/jesus/parables", label: "Parables", note: "Read each parable in every Gospel that tells it." },
  { href: "/jesus/life", label: "His life on the map", note: "Follow Gospel events through places and sources." },
  { href: "/jesus/risen", label: "Cross to ascension", note: "Follow the passion and resurrection accounts source by source." },
  { href: "/jesus/harmony", label: "Gospels word by word", note: "Compare parallel Gospel passages side by side." },
  { href: "/jesus/prophecy", label: "Prophecy and fulfillment", note: "Inspect the passages and their Gospel reception." },
  { href: "/jesus/history", label: "What history can establish", note: "Examine textual and material records and their limits." },
  { href: "/jesus/history/belief-and-growth", label: "Belief and growth", note: "Examine a source-led account of belief and early Christian growth.", parent: "/jesus/history" },
  { href: "/jesus/lens", label: "How the world sees him", note: "Compare how different traditions understand Jesus." },
  { href: "/jesus/dossier", label: "Research worksheets", note: "Prepare a source worksheet about Jesus for further study." },
  { href: "/apostles/twelve", label: "The twelve", note: "Open the records of the men Jesus chose." },
  { href: "/apostles/sent", label: "The sending", note: "Follow the mission roads and their evidence." },
  { href: "/early/library", label: "Scripture and early-writings library", note: "Browse hosted editions, sections, and publication limits." },
  { href: "/early/search", label: "Search the writings", note: "Search translated texts, edition notes, and catalog references." },
  { href: "/early/ignatius", label: "Ignatius’ road", note: "Follow the letters and places on the way to Rome." },
  { href: "/early/era/jewish", label: "Jewish apocalyptic", note: "Browse visionary writings before and around the time of Christ.", parent: "/early" },
  { href: "/early/era/fathers", label: "The Apostolic Fathers", note: "Read the first generations after the apostles.", parent: "/early" },
  { href: "/early/era/apologists", label: "The Apologists", note: "Read early Christian defenses addressed to outsiders.", parent: "/early" },
  { href: "/early/era/apocrypha", label: "The Apocrypha", note: "Browse letters, acts, and visions associated with apostolic names.", parent: "/early" },
  { href: "/church/tree", label: "The tree", note: "Explore the branches of church history." },
  { href: "/church/faces", label: "The faces", note: "Meet people in the church’s historical record." },
  { href: "/church/councils", label: "The councils", note: "Inspect places, decisions, and source records." },
  { href: "/church/giants", label: "The giants", note: "Explore influential lives and their documented work." },
  { href: "/angels/fall", label: "The fall", note: "Trace the source passages behind the fall narrative." },
  { href: "/angels/encounters", label: "The encounters", note: "Read recorded encounters with the unseen." },
  { href: "/angels/demons", label: "The demons", note: "Follow names, titles, and claims into their sources." },
  { href: "/angels/vocabulary", label: "The vocabulary", note: "Inspect selected Hebrew and Greek terms in context." },
  { href: "/angels/dossier", label: "Research dossier builder", note: "Prepare source worksheets about angels and demons." },
  { href: "/angels/stories", label: "Visual stories", note: "Explore illustrated stories with their Scripture references." },
  { href: "/angels/stories/i-am-with-you", label: "I am with you", note: "Read the story at Bethel with its source text.", parent: "/angels/stories" },
  { href: "/angels/stories/open-his-eyes", label: "Open his eyes", note: "Read the story at Dothan with its source text.", parent: "/angels/stories" },
  { href: "/angels/stories/the-gate-opened", label: "The gate opened", note: "Read the story in Jerusalem with its source text.", parent: "/angels/stories" },
  { href: "/word/free", label: "The free way", note: "Inspect the source and license chain for hosted texts." },
  { href: "/word/cases", label: "The cases", note: "Examine translation licensing disputes and source records." },
  { href: "/evidence/frameworks", label: "The Afterlife Atlas", note: "Explore afterlife frameworks through their sources and limits." },
  { href: "/evidence/frameworks/compare", label: "Compare traditions", note: "Compare observed evidence, interpretations, and limits.", parent: "/evidence/frameworks" },
  { href: "/sources", label: "Sources & method", note: "Inspect text sources, attribution, and evidence standards." },
  { href: "/about", label: "About this work", note: "Meet its creator and understand the purpose." },
  { href: "/services", label: "Work with Garo", note: "Explore workflow diagnostics and knowledge pipelines." },
  { href: "/work", label: "Work & case studies", note: "Inspect the systems, decisions, and project status." },
  { href: "/work/eye", label: "EYE", note: "Explore the visual code execution case study.", parent: "/work" },
  { href: "/work/garovartabedian", label: "This research platform", note: "See how this site’s research and publishing system is built.", parent: "/work" },
  { href: "/work/jobpilot", label: "JobPilot", note: "Inspect the job-search workflow case study.", parent: "/work" },
  { href: "/work/landing-page", label: "Landing page demo", note: "Explore a sample independent bookkeeping business and prepare an inquiry.", parent: "/work" },
  { href: "/work/excel-handler", label: "Excel handler demo", note: "Check a spreadsheet and download a workbook with originals and a weekly summary.", parent: "/work" },
  { href: "/work/job-report", label: "Job report demo", note: "Try a phone-first job report tool before requesting customization.", parent: "/work" },
  { href: "/work/merge-monitor", label: "Merge Monitor", note: "Inspect coordination for parallel development work.", parent: "/work" },
  { href: "/work/accessibility", label: "Accessibility", note: "Inspect the accessibility system case study.", parent: "/work" },
  { href: "/work/telemetry", label: "Telemetry", note: "Inspect the telemetry case study.", parent: "/work" },
  { href: "/contact", label: "Contact", note: "Describe a project or reach Garo directly." },
  { href: "/hire", label: "Full-time employment", note: "Review experience and role fit." },
  { href: "/resume", label: "Résumé", note: "Read the web résumé or download the PDF." },
  { href: "/labs", label: "How this site is built", note: "Inspect live tools, corpus coverage, and the publishing pipeline." },
];

// Dynamic records keep a truthful content-type label. Their actual titles belong
// to the page’s data; turning an arbitrary slug into a title would invent one.
const RECORD_ROUTES: readonly SiteRoute[] = [
  { href: "/scriptures/topics/[topic]", label: "Topic", parent: "/scriptures/topics" },
  { href: "/scriptures/parallels/[id]", label: "Parallel comparison", parent: "/scriptures/parallels" },
  { href: "/scriptures/[tradition]", presentation: "reader", label: "Scripture tradition", parent: "/scriptures" },
  { href: "/scriptures/[tradition]/[book]", presentation: "reader", label: "Book", parent: "/scriptures/[tradition]" },
  { href: "/scriptures/[tradition]/[book]/[chapter]", presentation: "reader", label: "Chapter", parent: "/scriptures/[tradition]/[book]" },
  { href: "/scriptures/stories/[slug]", presentation: "reader", label: "Scripture story", parent: "/scriptures/stories" },
  { href: "/apostles/stories/[slug]", label: "Apostle story", parent: "/apostles" },
  { href: "/early/[text]", presentation: "reader", label: "Writing", parent: "/early" },
  { href: "/early/era/[era]", label: "Era", parent: "/early" },
  { href: "/early/library/[edition]", label: "Edition", parent: "/early/library" },
  { href: "/early/library/[edition]/[section]", presentation: "reader", label: "Reading section", parent: "/early/library/[edition]" },
  { href: "/evidence/frameworks/[slug]", label: "Tradition dossier", parent: "/evidence/frameworks" },
];

export function sitePath(href: string): string {
  return (href.split(/[?#]/, 1)[0] || "/").replace(/\/+$/, "") || "/";
}

export function getWorldForPath(pathname: string) {
  const path = sitePath(pathname);
  return WORLD_REGISTRY.find(
    (world) => path === world.href || path.startsWith(`${world.href}/`),
  );
}

export function getWorldRoutes(worldId: WorldId): SiteLink[] {
  const world = WORLD_REGISTRY.find((entry) => entry.id === worldId);
  if (!world) return [];
  return SITE_ROUTES.filter(
    (route) => route.href === world.href || route.href.startsWith(`${world.href}/`),
  );
}

/** Sections remain active on their descendants; home never matches every route. */
export function getNavigationCurrent(
  pathname: string,
  href: string,
): "page" | "location" | undefined {
  // usePathname does not track fragment state. Do not mark every in-page link
  // current merely because its document is open.
  if (href.includes("#")) return undefined;
  const current = sitePath(pathname);
  const target = sitePath(href);
  if (current === target) return "page";
  return target !== "/" && current.startsWith(`${target}/`) ? "location" : undefined;
}

function resolveRecord(pathname: string): SiteRoute | undefined {
  const segments = pathname.split("/");
  const pattern = RECORD_ROUTES
    .filter((route) => {
      const parts = route.href.split("/");
      return parts.length === segments.length && parts.every(
        (part, index) => part.startsWith("[") || part === segments[index],
      );
    })
    .sort((a, b) => {
      const specificity = (href: string) => href.split("/").filter((part) => part && !part.startsWith("[")).length;
      return specificity(b.href) - specificity(a.href);
    })[0];
  if (!pattern) return undefined;
  const patternSegments = pattern.href.split("/");
  const values = new Map(patternSegments.map((part, index) => [part, segments[index]]));
  return {
    ...pattern,
    href: pathname,
    parent: pattern.parent?.split("/").map((part) => values.get(part) ?? part).join("/"),
  };
}

function resolveRoute(pathname: string): SiteRoute | undefined {
  return SITE_ROUTES.find((route) => route.href === pathname) ?? resolveRecord(pathname);
}

export function getSiteLocation(pathname: string) {
  const path = sitePath(pathname);
  const world = getWorldForPath(path);
  const route = resolveRoute(path);
  const breadcrumbs: SiteLink[] = [];
  let current: SiteRoute | undefined = route ?? {
    href: path,
    label: "Current page",
    parent: world?.href ?? "/",
  };
  const seen = new Set<string>();
  while (current && !seen.has(current.href)) {
    seen.add(current.href);
    breadcrumbs.unshift({ href: current.href, label: current.label });
    const parent: string | undefined = current.parent ?? (
      current.href === "/" ? undefined : getWorldForPath(current.href)?.href ?? "/"
    );
    current = parent && parent !== current.href ? resolveRoute(parent) : undefined;
  }
  if (world && breadcrumbs[0]?.href === "/") {
    breadcrumbs[0] = { href: "/#worlds", label: "All worlds" };
  }
  return {
    pathname: path,
    label: route?.label ?? "Current page",
    note: route?.note,
    presentation: route?.presentation,
    world,
    breadcrumbs,
  };
}
