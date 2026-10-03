import Link from "next/link";
import type { RisenDescentRecord } from "@/lib/jesus/types";

/**
 * How the three days were read, oldest first. Each record states what it
 * actually shows and where it stops — the same standard the history room uses.
 */
export default function DescentShelf({ records }: { records: RisenDescentRecord[] }) {
  return (
    <div className="jsu-evidence-list">
      {records.map((record) => (
        <details className="jsu-evidence-record" id={record.id} key={record.id}>
          <summary>
            <span className="jsu-evidence-assessment">{record.kind}</span>
            <strong>{record.name}</strong>
            <span>{record.date}</span>
          </summary>
          <div className="jsu-evidence-body">
            <blockquote className="jsu-risen-claim">{record.claim}</blockquote>
            <div className="jsu-risen-boundary">
              <div>
                <strong>What this shows</strong>
                <span>{record.establishes}</span>
              </div>
              <div>
                <strong>Where it stops</strong>
                <span>{record.limits}</span>
              </div>
            </div>
            <p className="jsu-cite">
              {record.sourceUrl.startsWith("/") ? (
                <Link href={record.sourceUrl} className="textlink">
                  {record.sourceLabel}
                </Link>
              ) : (
                <a
                  href={record.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="textlink"
                >
                  {record.sourceLabel}
                </a>
              )}
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}
