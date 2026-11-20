"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { parseReleaseSummaryEnv } from "@/lib/site/release-summary";
import { SITE_XRAY } from "@/lib/site/site-xray";
import { xrayFamilyFor } from "@/lib/site/xray-families.mjs";

// Inlined by next.config.ts at build time; "" when the build had no release record.
const RELEASE = parseReleaseSummaryEnv(process.env.RELEASE_RECORD_SUMMARY);
const n = (value: number) => value.toLocaleString("en-US");

/**
 * How this page reached the visitor: the repository's counts, the browser
 * specs that drive this kind of page, and the release gate. Rendered on every
 * page, always in the DOM, shown only under the Engineer lens.
 */
export default function XrayFoot() {
  const pathname = usePathname() ?? "/";
  const family = xrayFamilyFor(pathname);
  const specs = family ? SITE_XRAY.routeTests[family.id] ?? [] : [];
  const kind = family?.label ?? "this page";
  const c = SITE_XRAY.counts;
  return (
    <section id="xray-foot" className="xray-foot" aria-labelledby="xray-foot-h" data-release-attempts={RELEASE?.attempts}>
      <h2 id="xray-foot-h">How this page reached you</h2>
      <p>
        {n(c.buildScripts)} build scripts write {n(c.publicJson)} JSON files. Before a release, {n(c.unitTestFiles)} unit test files, {n(c.smokeChecks)} smoke checks and {n(c.browserSpecs)} browser specs run.
      </p>
      <p>{specs.length > 0 ? `Browser specs that drive ${kind}: ${specs.join(", ")}.` : `No browser spec names ${kind} by path.`}</p>
      {RELEASE ? (
        <>
          <p>
            {n(RELEASE.attempts)} earlier release attempts are recorded. Each one runs this gate in order; a stop at any step leaves the previous release live.
          </p>
          <ol className="xray-steps">
            {RELEASE.steps.map((step, index) => (
              <li key={`${index}-${step}`}>{step}</li>
            ))}
          </ol>
        </>
      ) : (
        <p>Local build; no release record.</p>
      )}
      <p>
        <Link href="/work/garovartabedian">Full release record</Link>
      </p>
    </section>
  );
}
