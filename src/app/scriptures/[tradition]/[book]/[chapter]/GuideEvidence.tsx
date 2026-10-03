import type { BriefingSource } from "@/lib/scriptures/types";

/** Use the book's source records so a chapter never invents a second citation. */
export default function GuideEvidence({
  sourceIds,
  sources,
}: {
  sourceIds?: string[];
  sources: BriefingSource[];
}) {
  const cited = sourceIds?.flatMap((id) => {
    const source = sources.find((item) => item.id === id);
    return source ? [source] : [];
  }) ?? [];
  if (!cited.length) return null;

  return (
    <p className="scr-guide-evidence">
      <strong>Sources:</strong>{" "}
      {cited.map((source, index) => (
        <span key={source.id}>
          {index > 0 && "; "}
          {source.href || source.url ? (
            <a href={source.href ?? source.url}
              {...(!source.href && source.url ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {source.label}
            </a>
          ) : source.label}
        </span>
      ))}
    </p>
  );
}
