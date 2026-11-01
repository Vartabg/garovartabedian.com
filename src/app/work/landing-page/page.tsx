import type { Metadata } from "next";
import Link from "next/link";
import { LANDING_DEMO as demo } from "@/lib/landing-demo-content";
import { STARTER_MENU as menu } from "@/lib/portfolio-content";
import InquiryPreview from "./InquiryPreview";
import LedgerScene from "./LedgerScene";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: { absolute: `${demo.title} — Garo Vartabedian` },
  description: demo.description,
  alternates: { canonical: demo.href },
  openGraph: { title: demo.title, description: demo.description, url: demo.href },
};

const packagePrice = new Intl.NumberFormat("en-US", {
  style: "currency", currency: menu.currency, maximumFractionDigits: 0,
}).format(menu.price);

export default function LandingPageDemo() {
  return (
    <div className={styles.page}>
      <aside className={styles.demoBar} aria-label="About this landing page example">
        <div className={styles.demoBarInner}>
          <p><span className={styles.demoDot} aria-hidden="true" /> Fictional business <span aria-hidden="true">·</span> Landing-page example</p>
          <Link href={menu.href}>Back to the {packagePrice} package <span aria-hidden="true">↗</span></Link>
        </div>
      </aside>

      <header className={styles.siteHeader}>
        <a className={styles.brand} href="#main" aria-label="Good Measure — back to the top">
          <svg viewBox="0 0 34 34" aria-hidden="true" className={styles.brandMark}>
            <path d="M1 1H33V33H1Z M1 11.5H33 M1 22.5H33 M11.5 1V33 M22.5 1V33" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="m5 16 3 3 8-9M17 27h12" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span>{demo.brand}<small>{demo.descriptor}</small></span>
        </a>
        <nav aria-label="Example business navigation" className={styles.navigation}>
          <a href="#services">The work</a>
          <a href="#process">How it starts</a>
          <a href="#request">Make an inquiry <span aria-hidden="true">↗</span></a>
        </nav>
      </header>

      <main id="main" className={styles.main}>
        <section className={styles.hero} aria-labelledby="landing-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>For people who work for themselves.</p>
            <h1 id="landing-title">{demo.headline[0]}<br /><em>{demo.headline[1]}</em></h1>
            <p className={styles.heroDescription}>{demo.introduction}</p>
            <a className={styles.primaryAction} href="#request">Let’s talk about your books <span aria-hidden="true">↗</span></a>
            <p className={styles.heroFootnote}>A practical place to begin. No account or financial details needed to try this example.</p>
          </div>
          <LedgerScene />
          <div className={styles.heroBaseline} aria-hidden="true"><span>Income & expenses.</span><span>Records & receipts.</span><span>The questions in between.</span></div>
        </section>

        <section id="services" className={styles.services} aria-labelledby="services-title">
          <header className={styles.sectionIntro}>
            <p className={styles.eyebrow}>01 / The work</p>
            <h2 id="services-title">A few things<br />off your desk.</h2>
            <p>Choose the part that needs attention. The details come before the quote.</p>
          </header>
          <div className={styles.serviceIndex}>
            {demo.services.map((service) => (
              <article key={service.id} className={styles.serviceRow}>
                <span className={styles.serviceNumber} aria-hidden="true">{service.number}</span>
                <div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <span className={styles.serviceDetail}>{service.detail}</span>
                </div>
                <span className={styles.serviceMark} aria-hidden="true">↗</span>
              </article>
            ))}
          </div>
        </section>

        <section id="process" className={styles.process} aria-labelledby="process-title">
          <header className={styles.processHeading}>
            <p className={styles.eyebrow}>02 / How it starts</p>
            <h2 id="process-title">Start with<br /><em>what you have.</em></h2>
            <p>Before sharing records or granting access, agree on what’s needed and how it will be handled.</p>
          </header>
          <ol className={styles.processSteps}>
            {demo.process.map((step, index) => (
              <li key={step.title}>
                <span className={styles.stepNumber} aria-hidden="true">0{index + 1}</span>
                <div><h3>{step.title}</h3><p>{step.description}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section id="request" className={styles.request} aria-labelledby="request-title">
          <header className={styles.requestHeading}>
            <p className={styles.eyebrow}>03 / Try the page</p>
            <h2 id="request-title">What’s on<br /><em>your desk?</em></h2>
            <p>Four choices make a short inquiry you can read and copy. This demo won’t send it anywhere.</p>
            <p className={styles.requestAside}>Use pretend details. Please don’t enter account numbers, tax information, passwords, or other financial data.</p>
          </header>
          <InquiryPreview />
        </section>

        <aside className={styles.package} aria-labelledby="package-title">
          <div>
            <p className={styles.eyebrow}>Make this kind of page yours</p>
            <h2 id="package-title">A page for<br />your business.</h2>
            <p>This fictional page shows the landing-page part of Garo’s business package. Get one page with your copy and assets, an Excel document handler, and a mobile job report — all three customized for your business.</p>
          </div>
          <div className={styles.packageAction}>
            <p className={styles.packagePrice}>{packagePrice} <span>{menu.currency} total · paid once</span></p>
            <a className={styles.primaryAction} href={menu.inquiryHref}>{menu.inquiryLabel} <span aria-hidden="true">↗</span></a>
            <p>One business. Three agreed scopes. One revision per deliverable. Opens an email inquiry to Garo; no demo choices are attached.</p>
            <Link className={styles.textLink} href={menu.href}>See the package scope and try the other tools</Link>
          </div>
        </aside>
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerBrand}>{demo.brand}<span aria-hidden="true"> / </span><span>Fictional business</span></span>
        <p>A landing-page example by <Link href="/work">Garo Vartabedian</Link>.</p>
      </footer>
    </div>
  );
}
