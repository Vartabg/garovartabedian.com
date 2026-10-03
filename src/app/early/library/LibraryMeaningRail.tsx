"use client";

import Link from "next/link";
import MeaningRail from "@/app/_components/MeaningRail";
import { LIBRARY_MEANING_NOTE } from "@/lib/early/library";
import type { LibraryEntry } from "@/lib/semantic-corpus";

export default function LibraryMeaningRail({ initialQuery = "" }: { initialQuery?: string }) {
  return (
    <MeaningRail<LibraryEntry>
      corpus="library"
      label="Ask the expanded editions"
      placeholder="the creation of the world"
      initialQuery={initialQuery}
      note={LIBRARY_MEANING_NOTE}
      renderHit={(hit) => (
        <Link href={hit.entry.href} prefetch={false}>
          {hit.entry.label}
          <small> · {hit.entry.edition}</small>
          {hit.entry.chunk && hit.entry.chunk.count > 1 && (
            <small> · Matched excerpt {hit.entry.chunk.index + 1} of {hit.entry.chunk.count}</small>
          )}
        </Link>
      )}
    />
  );
}
