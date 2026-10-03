"use client";

import Link from "next/link";
import { useState } from "react";
import type { PathStep } from "@/lib/scriptures/graph-tracer";
import styles from "./connections.module.css";

export default function PathMap({ chain }: { chain: PathStep[] }) {
  const [selected, setSelected] = useState(0);
  const step = chain[selected];
  if (!step) return null;
  return <div className={styles.pathMap}>
    <p className={styles.legend}>Select a stop to inspect its passage. Lines follow the displayed path; the tracer can traverse a reference in either direction.</p>
    <ol className={styles.pathStops} aria-label="Interactive path map">
      {chain.map((node, index) => <li key={`${index}-${node.id}`}>
        <button type="button" onClick={() => setSelected(index)} aria-pressed={selected === index} aria-controls="path-inspector">
          <span>{String(index + 1).padStart(2, "0")}</span>{node.ref}
        </button>
      </li>)}
    </ol>
    <article id="path-inspector" className={styles.passage} aria-live="polite" aria-atomic="true">
      <p className="kicker">Passage {selected + 1} of {chain.length}</p>
      <h4>{step.ref}</h4>
      {step.snippet ? <blockquote>{step.snippet}</blockquote> : <p>Open the chapter to read this passage in context.</p>}
      <Link href={step.href}>Read {step.ref} in context →</Link>
    </article>
  </div>;
}
