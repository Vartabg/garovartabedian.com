import type { Metadata } from "next";
import Link from "next/link";
import CleanChrome from "@/app/_components/CleanChrome";
import { EXCEL_HANDLER_OFFER, STARTER_MENU } from "@/lib/portfolio-content";
import ExcelHandlerDemo from "./ExcelHandlerDemo";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: { absolute: "Excel handler — try a real spreadsheet cleanup — Garo Vartabedian" },
  description: "Open an Excel or CSV file, check client-work records and download a clean workbook with a weekly summary. Free browser-local demo.",
  alternates: { canonical: "/work/excel-handler" },
};
export default function ExcelHandlerPage() {
  return <CleanChrome activeHref="/work" showWorldSwitcher={false}>
    <div className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>02 / Excel document handler</p>
        <h1>From loose rows<br />to a useful week.</h1>
        <p className={styles.lede}>A client-work export, cleaned up and added up. Try the sample, or bring a spreadsheet with dates, clients, services and dollar amounts.</p>
        <p className={styles.privacy}>Free to try. Your file stays in this open page. No upload or account. Download your workbook before closing.</p>
      </header>
      <ExcelHandlerDemo />
      <section className={styles.offer} aria-labelledby="excel-offer-title">
        <div><p className={styles.eyebrow}>Make it yours</p><h2 id="excel-offer-title">Your recurring task.<br />Your file layout.</h2><p>{EXCEL_HANDLER_OFFER.description}</p>
          <details><summary>What the customized version includes</summary><ul>{EXCEL_HANDLER_OFFER.scope.map(item => <li key={item}>{item}</li>)}</ul><p>{EXCEL_HANDLER_OFFER.boundary}</p></details>
        </div>
        <div className={styles.offerActions}><p className={styles.price}>{STARTER_MENU.priceLabel}<span>USD total · landing page + Excel handler + job report</span></p><a className={styles.primary} href={STARTER_MENU.inquiryHref}>{STARTER_MENU.inquiryLabel}</a><Link href="/work#starter-menu">See the whole package →</Link><p>The browser demo shows one example task. We agree on your task and desktop Excel version before starting.</p></div>
      </section>
      <p className={styles.footerLinks}><Link href="/work/landing-page">Try the landing page</Link><Link href="/work/job-report">Try the job report</Link><Link href="/work">Back to work</Link></p>
    </div>
  </CleanChrome>;
}
