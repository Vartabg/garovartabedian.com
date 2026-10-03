import { useEffect } from "react";

/**
 * Scrolls to the URL hash once the page's data has actually rendered.
 * Client-fetched content means the anchor target doesn't exist yet when the
 * browser makes its one native scroll attempt on load — this retries once
 * the data (and therefore the target element) is in the DOM.
 */
export function useHashScroll(ready: boolean) {
  useEffect(() => {
    if (!ready || !window.location.hash) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
  }, [ready]);
}
