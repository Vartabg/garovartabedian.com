import { ButtonAnchor, ButtonLink } from "@/app/_components/Button";
import { JOB_REPORT_OFFER as offer, STARTER_MENU as menu } from "@/lib/portfolio-content";
import styles from "./page.module.css";

export default function JobReportOffer({ expanded = false }: { expanded?: boolean }) {
  return (
    <section id={expanded ? "customize" : "try-job-report"} className={styles.offer} aria-labelledby={expanded ? "customize-title" : "job-report-offer-title"}>
      <div>
        <p className={styles.eyebrow}>{expanded ? "Make it yours" : "Try before you hire"}</p>
        <h2 id={expanded ? "customize-title" : "job-report-offer-title"}>{expanded ? "A job report tool for your business." : "A job report, made on your phone."}</h2>
        <p>{expanded ? "A customized version of this tool is included with a landing page and an Excel document handler in the $100 business package." : offer.description}</p>
        {!expanded && <ol className={styles.miniSteps}><li>Add your photos</li><li>Record the work</li><li>Save the report</li></ol>}
        {expanded && <ul className={styles.scope}>{offer.scope.map(item => <li key={item}>{item}</li>)}</ul>}
      </div>
      <div className={styles.offerActions}>
        <p className={styles.price}>{menu.priceLabel}<span>USD total for all three services</span></p>
        {!expanded && <ButtonLink href={offer.href} variant="primary">{offer.demoLabel}</ButtonLink>}
        <ButtonAnchor href={menu.inquiryHref} variant={expanded ? "primary" : "ghost"}>{menu.inquiryLabel}</ButtonAnchor>
        <ButtonLink href={menu.href} variant="ghost">See the full $100 package</ButtonLink>
        <p className={styles.small}>{expanded ? offer.boundary : "Your branding, checklist and report layout. One revision included."}</p>
        {expanded && <p className={styles.small}>Opens an email inquiry. We’ll agree on the scope before work starts. Your demo report is not attached or sent.</p>}
      </div>
    </section>
  );
}
