"use client";

import Link from "next/link";
import { openDisclosureForHash } from "@/lib/world-disclosure";

export type WorldHeroAction = { href: string; label: string };

/**
 * A section home's ways in, set under its opening paragraph so a phone shows
 * something to tap on the first screen. A link down the page takes a down
 * arrow and opens any folded section that holds its target; a link to another
 * page takes a right arrow.
 */
export default function WorldHeroActions({
  label,
  links,
}: {
  /** The navigation's accessible name. */
  label: string;
  links: WorldHeroAction[];
}) {
  return (
    <nav className="world-hero-actions" aria-label={label}>
      {links.map((link) =>
        link.href.startsWith("#") ? (
          <a
            key={link.href}
            href={link.href}
            onClick={() => {
              openDisclosureForHash(link.href, document);
            }}
          >
            {link.label} <span aria-hidden="true">↓</span>
          </a>
        ) : (
          <Link key={link.href} href={link.href}>
            {link.label} <span aria-hidden="true">→</span>
          </Link>
        ),
      )}
    </nav>
  );
}
