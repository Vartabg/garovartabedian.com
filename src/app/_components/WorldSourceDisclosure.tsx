import Link from "next/link";
import { WORLD_GUIDES, type WorldId } from "@/lib/world-guidance";

export default function WorldSourceDisclosure({ world }: { world: WorldId }) {
  const source = WORLD_GUIDES[world].source;

  return (
    <details className="wg-source-disclosure">
      <summary>Sources &amp; method</summary>
      <p className="wg-source">
        <strong>{source.label}:</strong> {source.text}
        {source.href && source.hrefLabel ? (
          <> <Link href={source.href}>{source.hrefLabel}</Link></>
        ) : null}
      </p>
    </details>
  );
}
