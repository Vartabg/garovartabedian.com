import styles from "./page.module.css";

/** Original vector artwork: no external asset, personal record, or client data. */
export default function LedgerScene() {
  return (
    <figure className={styles.scene}>
      <svg
        viewBox="0 0 580 580"
        role="img"
        aria-label="An original illustration of a tidy ledger, two receipts, and a pencil. All entries are fictional."
        className={styles.ledgerArt}
      >
        <g className={styles.sceneGrid} fill="none" strokeWidth="1">
          {[72, 136, 200, 264, 328, 392, 456, 520].map((x) => (
            <path key={`v${x}`} d={`M${x} 24V552`} />
          ))}
          {[72, 136, 200, 264, 328, 392, 456, 520].map((y) => (
            <path key={`h${y}`} d={`M24 ${y}H556`} />
          ))}
        </g>

        <g transform="rotate(-10 144 151)">
          <path className={styles.receiptBack} d="M38 52H223V270L211 263 199 270 187 263 175 270 163 263 151 270 139 263 127 270 115 263 103 270 91 263 79 270 67 263 55 270 38 263Z" strokeWidth="1.5" />
          <text x="60" y="86" className={styles.artSmall}>RECEIPT / 01</text>
          <path d="M60 102H199M60 125H148M60 142H173M60 159H137M60 205H199" className={styles.artRule} />
          <text x="60" y="189" className={styles.artSmall}>Materials</text>
          <text x="199" y="231" textAnchor="end" className={styles.artAmount}>85.00</text>
        </g>

        <g transform="rotate(7 425 385)">
          <path className={styles.receiptBack} d="M342 285H526V504L514 497 502 504 490 497 478 504 466 497 454 504 442 497 430 504 418 497 406 504 394 497 382 504 370 497 358 504 342 497Z" strokeWidth="1.5" />
          <text x="363" y="318" className={styles.artSmall}>RECEIPT / 02</text>
          <path d="M363 334H503M363 357H449M363 374H478M363 391H437M363 443H503" className={styles.artRule} />
          <text x="503" y="469" textAnchor="end" className={styles.artAmount}>24.00</text>
        </g>

        <path d="M129 98H447V443H129Z" className={styles.documentShadow} />
        <g transform="rotate(-2 285 266)">
          <rect x="114" y="84" width="318" height="345" className={styles.ledgerPaper} strokeWidth="1.7" />
          <path d="M114 84H432V159H114Z" className={styles.ledgerHead} />
          <text x="138" y="115" className={styles.artTitle}>THE MONTH,</text>
          <text x="138" y="141" className={styles.artTitle}>IN ORDER.</text>
          <text x="405" y="140" className={styles.artReverseSmall} textAnchor="end">MAY</text>
          <path d="M138 190H408M138 222H408M138 262H408M138 302H408M138 342H408M138 382H408M316 179V382" className={styles.artRule} />
          <text x="138" y="208" className={styles.artSmall}>ENTRY</text>
          <text x="407" y="208" className={styles.artSmall} textAnchor="end">AMOUNT</text>
          <text x="138" y="248" className={styles.artRow}>Materials</text>
          <text x="407" y="248" className={styles.artAmount} textAnchor="end">85.00</text>
          <text x="138" y="288" className={styles.artRow}>Software</text>
          <text x="407" y="288" className={styles.artAmount} textAnchor="end">24.00</text>
          <text x="138" y="328" className={styles.artRow}>Workspace</text>
          <text x="407" y="328" className={styles.artAmount} textAnchor="end">160.00</text>
          <text x="138" y="369" className={styles.artSmall}>EXAMPLE TOTAL</text>
          <text x="407" y="369" className={styles.artAmount} textAnchor="end">269.00</text>
          <path d="m139 402 5 5 10-12M172 402H244" className={styles.artCheck} fill="none" strokeWidth="2" />
        </g>

        <g transform="rotate(31 455 184)">
          <path d="M449 51H462V299L455.5 319 449 299Z" className={styles.pencil} strokeWidth="1.5" />
          <path d="M453 51V298M449 299H462M453 312H458" className={styles.pencilLine} fill="none" />
          <path d="M449 51V40Q455.5 32 462 40V51Z" className={styles.pencilCap} />
        </g>

        <g className={styles.artCorner} fill="none" strokeWidth="1.5">
          <path d="M35 495V541H81M499 33H545V79" />
          <path d="M49 520H100M74 495V545" />
        </g>
        <text x="115" y="509" className={styles.artFooter}>A PLACE FOR EVERY ENTRY.</text>
      </svg>
      <figcaption>Original illustration · fictional entries</figcaption>
    </figure>
  );
}
