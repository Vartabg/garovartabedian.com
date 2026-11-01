"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DISCOVERY, discoveryThreads } from "@/lib/discovery-content";
import type { WorldId } from "@/lib/world-registry";

export default function CuriosityCompass({ world }: { world: WorldId }) {
  const pathname = usePathname() ?? "/";
  const threads = discoveryThreads(world, pathname);
  return (
    <section className="curiosity-compass" aria-label={DISCOVERY.compassHeading}>
      <header><h2><span aria-hidden="true">✳ </span>{DISCOVERY.compassHeading}</h2><p>{DISCOVERY.compassNote}</p></header>
      <nav aria-label="Related research tools">
        {threads.map((tool) => (
          <Link href={tool.href} key={tool.id}>
            <span className="compass-mark" aria-hidden="true">{tool.mark}</span>
            <span><strong>{tool.label}</strong><span>{tool.description}</span></span>
            <span aria-hidden="true">↗</span>
          </Link>
        ))}
      </nav>
    </section>
  );
}
