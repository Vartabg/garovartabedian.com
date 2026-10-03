import type { Metadata } from "next";
import Link from "next/link";
import CleanChrome from "@/app/_components/CleanChrome";
import { ButtonAnchor, ButtonLink } from "@/app/_components/Button";
import { ACCESSIBILITY_CASE_STUDY as study } from "@/lib/portfolio-content";
import KeyboardExample from "./KeyboardExample";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: study.title,
  description: study.description,
  alternates: { canonical: "/work/accessibility" },
};

export default function AccessibilityCaseStudy() {
  return (
    <CleanChrome activeHref="/work" showWorldSwitcher={false}>
      <p className="kicker">Work / Four products, one responsibility</p>
      <h1>{study.title}</h1>
      <p className="lede">{study.lede}</p>
      <p className="cta-row">
        <ButtonAnchor variant="primary" href={study.source}>Read the public evidence</ButtonAnchor>
        <ButtonAnchor variant="ghost" href={study.checklist}>Use the checklist</ButtonAnchor>
      </p>
      <h2>Why this work matters</h2>
      <p>{study.purpose}</p>
      <KeyboardExample />
      <section aria-labelledby="repairs-title">
        <h2 id="repairs-title">What changed across the products</h2>
        <div className={styles.comparison}>
          {study.products.map((product) => (
            <article key={product.name} className={styles.panel}>
              <h3>{product.name}</h3>
              <p>{product.change}</p>
              <p><strong>Evidence:</strong> {product.evidence}</p>
              <Link href={product.href}>Explore {product.name}</Link>
            </article>
          ))}
        </div>
      </section>
      <h2>A failed scan must fail the release</h2>
      <p>A server that never starts, a broken route, or an unreadable report cannot count as a passing accessibility check. The shared standard makes those failures visible alongside rule violations. Representative routes are checked after a production build.</p>
      <h2>What the evidence establishes</h2>
      <p>{study.limits}</p>
      <p>The public repository includes the reusable checklist, contribution guidance, and the record of the original pass. Corrections are welcome.</p>
      <p className="cta-row">
        <ButtonLink variant="primary" href="/work">Explore the other case studies</ButtonLink>
        <ButtonLink variant="ghost" href="/contact">Discuss an interface</ButtonLink>
      </p>
    </CleanChrome>
  );
}
