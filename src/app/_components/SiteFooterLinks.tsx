import Link from "next/link";

/** The same exits stay available from a world, a reader, or the author's work. */
export default function SiteFooterLinks() {
  return (
    <nav className="site-footer-links" aria-label="About this work">
      <Link href="/#worlds">All worlds</Link>
      <Link href="/sources">Sources &amp; method</Link>
      <Link href="/about">About this work</Link>
      <Link href="/services">Work with Garo</Link>
    </nav>
  );
}
