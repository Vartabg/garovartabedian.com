import type { ReactNode } from "react";
export type ComparisonPassage = { id: string; label: string; exact: string; href: string; context: string };
/** Exact source text only; assessment code belongs to the optional caller. */
export default function PassageComparison({ passages, children }: { passages: ComparisonPassage[]; children?: ReactNode }) {
  return <><div className="reading-pair">{passages.map(p => <section key={p.id} className="reading-comparison-source" data-reading-role="source">
    <p className="reading-role">Source passage · Quotation</p><h3>{p.label}</h3><blockquote>{p.exact}</blockquote><a href={p.href}>Open the hosted source</a><details><summary>Full containing passage</summary><p className="reading-source-text">{p.context}</p></details>
  </section>)}</div>{children}</>;
}
