import Link from "next/link";
import { getSiteLocation } from "@/lib/site-navigation";
import { studyToolHref, type StudyContext } from "@/lib/scriptures/study-context";

const CURATED_TOOLS = ["catena", "diachronic", "disputation", "parallels"];

export default function StudyPassageLinks({ context }: { context: StudyContext }) {
  return <nav aria-label="Study this verse further" style={{ marginBlock: "1.25rem", borderTop: "1px solid var(--line)", paddingTop: ".75rem" }}>
    <div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem 1.25rem" }}>
      <Link className="textlink" href={studyToolHref("/scriptures/polyglot", context)}>Compare translations</Link>
      <Link className="textlink" href={studyToolHref("/scriptures/dossier", context)}>Build a research dossier</Link>
    </div>
    <details style={{ marginTop: ".5rem" }}>
      <summary style={{ cursor: "pointer", minHeight: "2.75rem", display: "list-item", paddingBlock: ".6rem" }}>More study paths</summary>
      <p>Explore selected readings and comparisons. Your starting verse stays available so you can return to it.</p>
      <ul>{CURATED_TOOLS.map(tool => {
        const path = `/scriptures/${tool}`;
        return <li key={tool}><Link className="textlink" href={studyToolHref(path, context)}>{getSiteLocation(path).label}</Link></li>;
      })}</ul>
    </details>
  </nav>;
}
