"use client";

import Link from "next/link";

/**
 * Last-resort boundary for an error thrown in the root layout itself. It
 * replaces the whole document, so it must render its own <html>/<body> and
 * cannot rely on globals.css — inline styles only.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: '"Atkinson Hyperlegible", Verdana, Arial, sans-serif',
          color: "#1a1a1a",
          background: "#faf8f4",
        }}
      >
        <style>{`
          .global-error-actions { display: flex; flex-wrap: wrap; gap: .75rem; align-items: center; }
          .global-error-action {
            display: inline-flex; min-height: 3rem; align-items: center; justify-content: center;
            padding: .7rem 1.1rem; border: 1px solid #1a1a1a; border-radius: 10px;
            background: transparent; color: #1a1a1a; font: inherit; font-weight: 700;
            line-height: 1.2; text-decoration: none; cursor: pointer; touch-action: manipulation;
            transition: background-color 140ms ease, color 140ms ease, transform 100ms ease;
          }
          .global-error-action:focus-visible { outline: 3px solid #faf8f4; box-shadow: 0 0 0 5px #24446b; }
          .global-error-action:active { transform: translateY(1px); }
          @media (hover: hover) and (pointer: fine) {
            .global-error-action:hover { background: #1a1a1a; color: #faf8f4; }
          }
          @media (prefers-reduced-motion: reduce) {
            .global-error-action { transition: none; }
            .global-error-action:active { transform: none; }
          }
          @media (forced-colors: active) {
            .global-error-action { border: 2px solid ButtonText; background: ButtonFace; color: ButtonText; }
            .global-error-action:focus-visible { outline: 3px solid Highlight; box-shadow: none; }
          }
        `}</style>
        <main style={{ padding: "4rem 1.5rem", maxWidth: "42rem", margin: "0 auto" }}>
          <h1>The site didn&rsquo;t load.</h1>
          <p>Try once more. If it still doesn&rsquo;t load, return home.</p>
          <p className="global-error-actions">
            <button
              type="button"
              onClick={reset}
              className="global-error-action"
            >
              Try once more
            </button>
            <Link href="/" className="global-error-action">
              Return home
            </Link>
          </p>
        </main>
      </body>
    </html>
  );
}
