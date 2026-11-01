"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { DISCOVERY, engineeringNote } from "@/lib/discovery-content";
import { getLens, serverLens, setLens, subscribeLens } from "@/lib/discovery-lens";

export default function DiscoveryLens() {
  const lens = useSyncExternalStore(subscribeLens, getLens, serverLens);
  const pathname = usePathname() ?? "/";
  const note = engineeringNote(pathname);
  useEffect(() => { document.documentElement.dataset.siteLens = lens; }, [lens]);

  return (
    <div className="discovery-lens">
      <div className="discovery-lens-bar">
        <span className="discovery-lens-hint">{DISCOVERY.lensHint}</span>
        <div role="group" aria-label={DISCOVERY.lensLabel} className="discovery-lens-options">
          <button type="button" aria-pressed={lens === "reader"} onClick={() => setLens("reader")}>{DISCOVERY.readerLabel}</button>
          <button type="button" aria-pressed={lens === "engineer"} aria-controls={lens === "engineer" ? "engineering-notes" : undefined} onClick={() => setLens("engineer")}>{DISCOVERY.engineerLabel}</button>
        </div>
      </div>
      {lens === "engineer" && (
        <aside id="engineering-notes" className="engineering-notes" aria-label={DISCOVERY.notesLabel}>
          <div><p>{note.title}</p><span>{note.text}</span></div>
          <Link href="/work/garovartabedian">{DISCOVERY.sourceLabel} <span aria-hidden="true">↗</span></Link>
        </aside>
      )}
    </div>
  );
}
