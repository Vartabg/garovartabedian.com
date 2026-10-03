import Link from "next/link";
import { refHref } from "@/lib/apostles/client";
import type { RefLink } from "@/lib/apostles/types";

/** A row of scripture refs, each resolving into the hosted reader. */
export default function RefLinks({ refs }: { refs: RefLink[] }) {
  if (!refs.length) return null;
  return (
    <span className="ap-refs">
      {refs.map((r, i) => (
        <span key={`${r.ref}-${i}`}>
          {i > 0 && <span aria-hidden="true"> · </span>}
          <Link href={refHref(r.ref)} className="textlink">
            {r.label}
          </Link>
        </span>
      ))}
    </span>
  );
}
