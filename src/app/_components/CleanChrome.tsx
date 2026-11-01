import Link from "next/link";
import WorldSwitcher from "./WorldSwitcher";
import SiteNavigation from "./SiteNavigation";
import SiteBreadcrumbs from "./SiteBreadcrumbs";
import SiteFooterLinks from "./SiteFooterLinks";
import { PROFILE } from "@/lib/portfolio-content";

/** Shared chrome and location trail for the portfolio and site information pages. */
export default function CleanChrome({
  children,
  showWorldSwitcher = true,
  activeHref,
}: {
  children: React.ReactNode;
  showWorldSwitcher?: boolean;
  activeHref?: string;
}) {
  return (
    <div className="clean">
      <header className="site-header">
        <div className="wrap">
          <Link href="/" className="brand">
            {PROFILE.name}
          </Link>
          <SiteNavigation activeHref={activeHref} />
        </div>
      </header>
      <div className="wrap clean-location">
        <SiteBreadcrumbs />
      </div>
      <main id="main">
        <div className="wrap">{children}</div>
      </main>
      <footer className="site-footer">
        <div className="wrap">
          <span>Thank you, Jesus · {PROFILE.location}</span>
          <span>
            <a href={`mailto:${PROFILE.links.email}`}>{PROFILE.links.email}</a>
          </span>
          <SiteFooterLinks />
        </div>
      </footer>
      {showWorldSwitcher ? <WorldSwitcher /> : null}
    </div>
  );
}
