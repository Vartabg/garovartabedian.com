import Link from "next/link";
import type { VerseStudyLink } from "@/lib/scriptures/verse-study-links";

/**
 * Two lines on the verse a story turns on: compare translations, see the
 * original words. Styles live in `styles/reading.css` (loaded on every page),
 * not in an import here, because unit tests render the pages that use this
 * and a stylesheet import fails outside the bundler.
 */
export default function PassageStudyLinks({ links }: { links: readonly VerseStudyLink[] }) {
  if (links.length === 0) return null;
  return (
    <nav className="passage-study" aria-label="Study this verse">
      <ul>
        {links.map((link) => (
          <li key={link.id}>
            <Link href={link.href}>
              <span>{link.label}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
