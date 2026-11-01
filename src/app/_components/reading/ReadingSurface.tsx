"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import ReadingSearchReturn from "./ReadingSearchReturn";
const Mode = createContext<{ trace: boolean; setTrace: (next: boolean) => void; hasTrace: boolean }>({ trace: false, setTrace: () => {}, hasTrace: false });
/**
 * The Read / Trace switch, and nothing else above the text. Size, theme and
 * typeface live behind the site-wide Aa control (the same ReadingAppearance
 * panel), so a reading page does not repeat them before its first sentence.
 * The explanation and legend appear only once Trace is on.
 */
export function ReadingTools() {
  const { trace, setTrace, hasTrace } = useContext(Mode);
  if (!hasTrace) return null;
  return <div className="reading-tools">
    <div role="group" aria-label="Reading mode" className="reading-modes"><button type="button" aria-pressed={!trace} onClick={() => setTrace(false)}>Read</button><button type="button" aria-pressed={trace} onClick={() => setTrace(true)}>Trace connections</button></div>
    <p className="reading-help" role="status">{trace ? "Source notes and suggested connections are marked. Read the sources together." : ""}</p>
    {trace && <div className="reading-legend" aria-label="Passage roles"><span data-reading-role="source">Source · solid</span><span data-reading-role="interpretation">Interpretation · dashed</span><span data-reading-role="question">Open question · dotted</span></div>}
  </div>;
}
export default function ReadingSurface({ children, className = "", hasTrace = false, as: Tag = "article", ...props }: { children: ReactNode; className?: string; hasTrace?: boolean; as?: "article" | "div"; "aria-labelledby"?: string; "aria-label"?: string; id?: string }) {
  const [trace, setTrace] = useState(false);
  return <Mode.Provider value={{ trace, setTrace, hasTrace }}><Tag {...props} className={`reading-surface ${className}`} data-reading-surface data-reading-mode={trace ? "trace" : "read"}><ReadingSearchReturn />{children}</Tag></Mode.Provider>;
}
