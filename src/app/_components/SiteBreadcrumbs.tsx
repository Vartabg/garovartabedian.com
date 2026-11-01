"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSiteLocation } from "@/lib/site-navigation";

/** The same location trail in world rooms and portfolio pages. */
export default function SiteBreadcrumbs({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  if (!pathname) return null;
  const { breadcrumbs } = getSiteLocation(pathname);
  if (breadcrumbs.length < 2) return null;

  return (
    <nav
      className={`site-breadcrumbs${className ? ` ${className}` : ""}`}
      aria-label="Breadcrumb"
    >
      <ol>
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href}>
            {index === breadcrumbs.length - 1 ? (
              <span aria-current="page">{crumb.label}</span>
            ) : (
              <Link href={crumb.href}>{crumb.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
