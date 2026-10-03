"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import ReadingAppearance from "./ReadingAppearance";
import ReadingSearchReturn from "./ReadingSearchReturn";
const Mode = createContext<{ trace: boolean; setTrace: (next: boolean) => void; hasTrace: boolean }>({ trace: false, setTrace: () => {}, hasTrace: false });
export function ReadingTools() {
  const { trace, setTrace, hasTrace } = useContext(Mode);
  return <div className="reading-tools">
    {hasTrace && <><div role="group" aria-label="Reading mode" className="reading-modes"><button type="button" aria-pressed={!trace} onClick={() => setTrace(false)}>Read</button><button type="button" aria-pressed={trace} onClick={() => setTrace(true)}>Trace connections</button></div><p className="reading-help" role="status">{trace ? "Source notes and suggested connections are marked. Read the sources together." : "Quiet reading. References stay within reach."}</p></>}
    <details><summary>Reading appearance</summary><ReadingAppearance /></details>
    {trace && <div className="reading-legend" aria-label="Passage roles"><span data-reading-role="source">Source · solid</span><span data-reading-role="interpretation">Interpretation · dashed</span><span data-reading-role="question">Open question · dotted</span></div>}
  </div>;
}
export default function ReadingSurface({ children, className = "", hasTrace = false, as: Tag = "article", ...props }: { children: ReactNode; className?: string; hasTrace?: boolean; as?: "article" | "div"; "aria-labelledby"?: string; "aria-label"?: string; id?: string }) {
  const [trace, setTrace] = useState(false);
  return <Mode.Provider value={{ trace, setTrace, hasTrace }}><Tag {...props} className={`reading-surface ${className}`} data-reading-surface data-reading-mode={trace ? "trace" : "read"}><ReadingSearchReturn />{children}</Tag></Mode.Provider>;
}
