import Link from "next/link";
import { studyContextLabel, studyReaderHref, studyToolHref, type StudyContext } from "@/lib/scriptures/study-context";

const bannerStyle = { marginBlock: "1.25rem", padding: "1rem 1.25rem", border: "1px solid var(--line)", borderLeft: ".2rem solid var(--accent-deep)", background: "var(--surface)", color: "var(--ink)", overflowWrap: "anywhere" as const };

export default function StudyContextBanner({ context, error, note, sourceText, currentTool }: {
  context: StudyContext | null;
  error?: string | null;
  note?: string;
  sourceText?: string | null;
  currentTool?: "polyglot" | "dossier";
}) {
  if (!context) return error ? <aside style={bannerStyle} role="status"><p>{error}</p><Link href="/scriptures">Choose a passage in the reader</Link></aside> : null;
  return <aside style={bannerStyle} aria-label="Study passage">
    <p style={{ fontWeight: 700, marginTop: 0 }}>{studyContextLabel(context)}</p>
    {sourceText && <blockquote>{sourceText}</blockquote>}
    {note && <p>{note}</p>}
    <nav aria-label="Continue studying this passage" style={{ display: "flex", flexWrap: "wrap", gap: ".75rem 1.25rem" }}>
      {currentTool !== "polyglot" && <Link className="textlink" href={studyToolHref("/scriptures/polyglot", context)}>Compare translations</Link>}
      {currentTool !== "dossier" && <Link className="textlink" href={studyToolHref("/scriptures/dossier", context)}>Build a research dossier</Link>}
      <Link className="textlink" href={studyReaderHref(context)}>Return to reading</Link>
    </nav>
  </aside>;
}
