"use client";

import { useEffect, useSyncExternalStore } from "react";
import { DISCOVERY } from "@/lib/discovery-content";
import { getLens, serverLens, setLens, subscribeLens } from "@/lib/discovery-lens";
import AccessibilityMenu from "./AccessibilityMenu";

/**
 * Reader or Engineer, plus reading & accessibility controls. The lens choice
 * sets html[data-site-lens]; the Engineer tags and the foot (XrayTag, XrayFoot)
 * are always in the page and show through CSS, so switching never re-renders
 * the page itself.
 */
export default function DiscoveryLens() {
  const lens = useSyncExternalStore(subscribeLens, getLens, serverLens);
  useEffect(() => { document.documentElement.dataset.siteLens = lens; }, [lens]);

  return (
    <div className="discovery-lens">
      <div className="discovery-lens-bar">
        <span className="discovery-lens-hint">{DISCOVERY.lensHint}</span>
        <div className="discovery-lens-controls">
          <div role="group" aria-label={DISCOVERY.lensLabel} className="discovery-lens-options">
            <button type="button" aria-pressed={lens === "reader"} onClick={() => setLens("reader")}>{DISCOVERY.readerLabel}</button>
            <button type="button" aria-pressed={lens === "engineer"} aria-controls="xray-foot" onClick={() => setLens("engineer")}>{DISCOVERY.engineerLabel}</button>
          </div>
          <AccessibilityMenu />
        </div>
      </div>
    </div>
  );
}
