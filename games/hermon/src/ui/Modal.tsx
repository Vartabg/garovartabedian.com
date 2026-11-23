import { useEffect, useId, useRef } from 'react';
import styles from './Experience.module.css';
import { useGame } from '@/game/store';
import { touchMode } from '@/game/pointerMode';

export default function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();

    // Progressive light-dismiss fallback for browsers without <dialog closedby="any"> (e.g. Safari).
    // Requires both pointerdown and pointerup outside the dialog box so slider drags never dismiss.
    let cleanupBackdrop: (() => void) | undefined;
    if (dialog && !('closedBy' in HTMLDialogElement.prototype)) {
      let pressedOutside = false;
      const outside = (e: PointerEvent) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      const down = (e: PointerEvent) => { pressedOutside = e.target === dialog && outside(e); };
      const up = (e: PointerEvent) => { if (pressedOutside && e.target === dialog && outside(e)) onCloseRef.current(); pressedOutside = false; };
      dialog.addEventListener('pointerdown', down);
      dialog.addEventListener('pointerup', up);
      cleanupBackdrop = () => {
        dialog.removeEventListener('pointerdown', down);
        dialog.removeEventListener('pointerup', up);
      };
    }

    return () => {
      cleanupBackdrop?.();
      dialog?.close();
      // Closing into live desktop play keeps focus on the game, so Space flies instead of reopening this dialog.
      const g = useGame.getState();
      if (g.started && !g.paused && !touchMode()) document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true });
      else previous?.focus();
    };
  }, []);

  return <dialog ref={ref} className={styles.modal} aria-labelledby={titleId}
    {...({ closedby: 'any' } as Record<string, string>)}
    onCancel={e => { e.preventDefault(); onClose(); }}
    onClose={() => { if (ref.current && !ref.current.open) onClose(); }}>
    <div className={styles.modalTop}><h2 id={titleId}>{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog">×</button></div>
    {children}
  </dialog>;
}
