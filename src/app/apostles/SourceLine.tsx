import Link from "next/link";

/** "Earliest source · source-link" line under a graded claim. */
export default function SourceLine({
  earliest,
  sourceUrl,
  name,
}: {
  earliest: string;
  sourceUrl: string;
  name: string;
}) {
  const internal = sourceUrl.startsWith("/");
  return (
    <span className="ap-earliest">
      {earliest} ·{" "}
      {internal ? (
        <Link href={sourceUrl} className="textlink" aria-label={`Source record for ${name}`}>
          source
        </Link>
      ) : (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="textlink"
          aria-label={`Source record for ${name}`}
        >
          source
        </a>
      )}
    </span>
  );
}
