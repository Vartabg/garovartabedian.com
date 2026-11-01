import { ButtonAnchor, ButtonLink } from "@/app/_components/Button";
import { STARTER_MENU, STARTER_OFFERS } from "@/lib/portfolio-content";
import styles from "./starter-menu.module.css";

export default function StarterMenu() {
  return (
    <section id="starter-menu" className={styles.menu} aria-labelledby="starter-menu-title">
      <h2 id="starter-menu-title">{STARTER_MENU.headline}</h2>
      <p className={styles.intro}>{STARTER_MENU.description} Try all three demos below before you ask.</p>
      <div className={styles.offers}>
        {STARTER_OFFERS.map((offer, index) => (
          <article key={offer.id} id={`offer-${offer.id}`} className={styles.card} aria-labelledby={`${offer.id}-title`}>
            <p className={styles.device}><span aria-hidden="true">0{index + 1} · </span>{offer.deviceLabel}</p>
            <h3 id={`${offer.id}-title`}>{offer.name}</h3>
            <p className={styles.description}>{offer.description}</p>
            <details className={styles.details}>
              <summary>What’s included</summary>
              <ul>{offer.scope.map(item => <li key={item}>{item}</li>)}</ul>
              <p>{offer.boundary}</p>
            </details>
            <ButtonLink href={offer.href} variant="ghost">{offer.demoLabel}</ButtonLink>
          </article>
        ))}
      </div>
      <div className={styles.packageActions}>
        <p className={styles.price}>{STARTER_MENU.priceLabel}<span>USD total · all three deliverables · one business</span></p>
        <ButtonAnchor href={STARTER_MENU.inquiryHref} variant="primary">{STARTER_MENU.inquiryLabel}</ButtonAnchor>
      </div>
      <p className={styles.nextStep}>{STARTER_MENU.nextStep}</p>
    </section>
  );
}
