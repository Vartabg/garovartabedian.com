import { studyToolHref, type StudyContext } from "./study-context";

export function parallelComparisonHref(slug: string, context?: StudyContext | null) {
  const query = context ? studyToolHref("/scriptures/parallels", context).slice("/scriptures/parallels".length) : "";
  return `/scriptures/parallels/${encodeURIComponent(slug)}${query}`;
}
