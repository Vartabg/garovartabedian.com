'use client';
import { useEffect } from 'react';

/** Other controls follow the header when larger text changes its height. */
export function useRowExtra() {
  useEffect(() => {
    const header = document.querySelector('main > header'), box = header?.parentElement;
    if (!header || !box || typeof ResizeObserver === 'undefined') return;
    const set = () => {
      const row = parseFloat(getComputedStyle(box).getPropertyValue('--row')) || 44;
      const extra = header.hasAttribute('data-play') ? Math.max(0, Math.round(header.getBoundingClientRect().height - row)) : 0;
      box.style.setProperty('--row-extra', `${extra}px`);
    };
    const watch = new ResizeObserver(set);
    watch.observe(header); set();
    return () => { watch.disconnect(); box.style.removeProperty('--row-extra'); };
  }, []);
}
