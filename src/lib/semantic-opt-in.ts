/**
 * Whether this reader has agreed to download the meaning-search model.
 *
 * The model is ~23 MB and is fetched once. Before this was persisted, the
 * decision lived in a module variable, so it died on reload: a reader who
 * opted in yesterday — or five minutes ago, before following a link — was
 * asked again, and the button implied a second download that the browser cache
 * had already made unnecessary. Persisting the choice is what makes the
 * feature usable more than once.
 *
 * Stored per browser, never sent anywhere. Every access is guarded: private
 * windows and blocked site data make `localStorage` throw rather than return
 * null, and a reader in that state should still get a working page with the
 * opt-in button showing.
 */

const KEY = "gv.semantic.optIn";

export function hasOptedIntoMeaningSearch(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function rememberMeaningSearchOptIn(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    // A reader who blocks site data still gets the search; they just get asked
    // again next time. That is the correct trade, not an error worth showing.
  }
}

export function forgetMeaningSearchOptIn(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to undo if the store was never writable.
  }
}
