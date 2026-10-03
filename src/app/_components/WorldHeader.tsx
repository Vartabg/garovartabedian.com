import Link from "next/link";
import SiteNavigation from "./SiteNavigation";

export default function WorldHeader({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <header className="site-header world-header">
      <div className="wrap">
        <div className="world-brand-lockup">
          <Link href="/" className="world-home-seal" aria-label="Home">
            <span className="st-cross-mark" aria-hidden="true" />
          </Link>
          <Link href={href} className="brand">
            {label}
          </Link>
        </div>
        <SiteNavigation activeHref={href} />
      </div>
    </header>
  );
}
