import type { ReactNode } from "react";

export default function ResponsiveSvgFrame({
  label,
  children,
  hint = "Swipe sideways to inspect the full diagram.",
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <>
      <div
        className="responsive-svg-frame"
        role="group"
        aria-label={`${label}. Scrolls sideways on narrow screens.`}
        tabIndex={0}
      >
        {children}
      </div>
      <p className="responsive-svg-hint" aria-hidden="true">
        {hint}
      </p>
    </>
  );
}
