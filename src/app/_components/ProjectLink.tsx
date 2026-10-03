import Link from "next/link";

/**
 * External projects (GitHub, live demos) get a plain anchor with the
 * standard new-tab safety attributes; internal case studies get a Next
 * Link so client-side navigation still applies. Shared by /hire and /work
 * so the two proof grids can't drift.
 */
export default function ProjectLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return <Link href={href}>{children}</Link>;
}
