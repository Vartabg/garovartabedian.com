import Link from "next/link";
import { SOURCE_BASIS, type SourceBasisId } from "@/lib/source-guidance";

export default function SourceBasis({ id }: { id: SourceBasisId }) {
  const basis = SOURCE_BASIS[id];

  return (
    <aside className="source-basis" aria-label="Source basis">
      <div>
        <p className="source-basis-kicker">Source basis</p>
        <h2 className="source-basis-title">{basis.title}</h2>
        <p>{basis.body}</p>
      </div>
      <dl className="source-basis-list">
        {basis.items.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
      <Link href={basis.href} className="source-basis-link">
        {basis.hrefLabel}
      </Link>
    </aside>
  );
}
