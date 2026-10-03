"use client";

import Link from "next/link";
import { Button, ButtonLink } from "./_components/Button";

/**
 * Route-level error boundary. A render error in any page is caught here and
 * contained to that route — the header, dock, and the rest of the site keep
 * working — instead of white-screening. "Try again" re-renders the segment.
 */
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main" className="wrap" style={{ padding: "4rem 1.5rem", maxWidth: "42rem" }}>
      <h1>This page didn&rsquo;t load.</h1>
      <p>
        Try this page again. If it still doesn&rsquo;t load, return to the{" "}
        <Link href="/" className="textlink">
          homepage
        </Link>
        .
      </p>
      <p className="cta-row">
        <Button onClick={reset}>Try this page again</Button>
        <ButtonLink href="/" variant="ghost">Return home</ButtonLink>
      </p>
    </main>
  );
}
