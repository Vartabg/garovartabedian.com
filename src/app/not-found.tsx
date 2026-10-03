import type { Metadata } from "next";
import { ButtonLink } from "./_components/Button";
import NotFoundScripture from "./_components/NotFoundScripture";

export const metadata: Metadata = {
  title: "Page not found",
};

/** Real 404 for routes that don't exist — returns the correct status and a way home. */
export default function NotFound() {
  return (
    <main id="main" className="wrap" style={{ padding: "5rem 1.5rem", maxWidth: "42rem" }}>
      <h1>We couldn&rsquo;t find that page.</h1>
      <p className="lede">
        That address doesn&rsquo;t lead anywhere on this site. Return home and step
        into one of the worlds from there.
      </p>
      <NotFoundScripture />
      <p className="cta-row">
        <ButtonLink href="/" variant="primary">Return home</ButtonLink>
      </p>
    </main>
  );
}
