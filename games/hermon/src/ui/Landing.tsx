import type { ReactNode } from 'react';
import styles from './Experience.module.css';
import entry from './mountainEntry.module.css';
import { CROSSING_PATH, STORIES_PATH } from '@/paths';

type Props = { started: boolean; failed: boolean; ready: boolean; zoomNote: boolean; note: string; onEnter: () => void; onRetry: () => void; children?: ReactNode };

/** The brand link in the top row (landing and the failed world only). */
export function Brand() {
  return <a className={styles.brand} href={STORIES_PATH}>Playable stories</a>;
}

export default function Landing({ started, failed, ready, zoomNote, note, onEnter, onRetry, children }: Props) {
  const off = started || failed;
  return <>
    <div className={off ? styles.heroOff : styles.hero}><h1 className={off ? 'sr-only' : styles.heroTitle}>Hermon <br /><em>at dawn.</em></h1>
      {failed && <div className={styles.recovery} role="alert"><h2>The world needs a moment.</h2><p>Your field guide remains available. Reload the scene to continue from your saved landing.</p>{note && <p>{note}</p>}<button type="button" className={styles.primary} onClick={onRetry}>Reload scene</button></div>}
      {!off && <section className={styles.intro} aria-label="Ascend Mount Hermon">
        <p className={styles.eyebrow}><span className={styles.statusDot} /> BOOK OF ENOCH <span>/</span> MOUNT HERMON</p>
        <p className={styles.introCopy}>Two hundred Watchers swear an oath. Two shepherds carry the warning down the mountain.</p>
        <div className={entry.choices}>
          <a className={entry.chapter} href={CROSSING_PATH}>Play The Cloven Arch</a>
          <button type="button" className={entry.free} disabled={!ready} onClick={onEnter}>{ready ? 'Ascend Mount Hermon' : 'Calling your angel…'}</button>
        </div>
        <p className={styles.introHint} role="status">{note || (zoomNote ? 'Pinch out to normal size, then tap Ascend.' : 'Ascend for free flight over Mount Hermon.')}</p>
        {children}
      </section>}</div>
    {!started && <footer className={styles.introFooter}><span>1 ENOCH VI <small>THE WATCHERS</small><b>—</b> HERMON <small>AT DAWN</small></span><span>ARCHANGEL <small>OF THE COVENANT</small></span></footer>}
  </>;
}
