"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WORLD_GUIDES, type WorldId } from "@/lib/world-guidance";
import { worldContinuation } from "@/lib/world-continuity";
import CuriosityCompass from "./CuriosityCompass";

export function WorldNextSteps({ world }: { world: WorldId }) {
  const pathname = usePathname() ?? WORLD_GUIDES[world].base;
  const config = WORLD_GUIDES[world];
  const links = worldContinuation(world, pathname);
  return (
    <section className="world-continuation" aria-label="Continue exploring">
      <nav className="world-next" aria-label={`${config.label} guided next steps`}>
        <h2 className="world-next-label">Continue exploring</h2>
        <div className="world-next-grid">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <small>{link.context}</small>
              <strong>{link.label}<span aria-hidden="true"> →</span></strong>
              {link.note ? <span>{link.note}</span> : null}
            </Link>
          ))}
        </div>
      </nav>
      <details className="world-related-tools">
        <summary>More research tools</summary>
        <CuriosityCompass world={world} />
      </details>
    </section>
  );
}
