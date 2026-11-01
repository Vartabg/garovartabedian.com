import { SITE_ROUTES, type SiteLink } from "../site-navigation";

type StudyGroupSpec = {
  id: string;
  title: string;
  question: string;
  paths: readonly string[];
};

/** The destinations supply their own canonical names and descriptions. */
const STUDY_GROUPS: readonly StudyGroupSpec[] = [
  {
    id: "words",
    title: "Read the words closely",
    question: "What does this passage say, and what stands behind its words?",
    paths: ["/scriptures/search", "/scriptures/word-bridge", "/scriptures/polyglot", "/scriptures/diachronic"],
  },
  {
    id: "connections",
    title: "Follow the connections",
    question: "Where else does this appear, and how have others read it?",
    paths: ["/scriptures/topics", "/scriptures/graph", "/scriptures/catena", "/scriptures/disputation"],
  },
  {
    id: "sources",
    title: "Compare the sources",
    question: "Which traditions and source records support a claim?",
    paths: ["/scriptures/canons", "/scriptures/parallels", "/scriptures/resonance", "/scriptures/dossier"],
  },
  {
    id: "examples",
    title: "Walk through an example",
    question: "See how a reading becomes a source-backed investigation.",
    paths: ["/scriptures/read/isaiah-53-clement-16", "/scriptures/investigations/isaiah-53-clement-16"],
  },
];

export type ScriptureStudyGroup = Omit<StudyGroupSpec, "paths"> & { tools: SiteLink[] };

export function scriptureDestination(href: string, routes: readonly SiteLink[] = SITE_ROUTES): SiteLink {
  const destination = routes.find((route) => route.href === href);
  if (!destination) throw new Error(`Scripture study destination is missing from SITE_ROUTES: ${href}`);
  return destination;
}

export function scriptureStudyCatalog(routes: readonly SiteLink[] = SITE_ROUTES): ScriptureStudyGroup[] {
  return STUDY_GROUPS.map(({ paths, ...group }) => ({
    ...group,
    tools: paths.map((href) => scriptureDestination(href, routes)),
  }));
}
