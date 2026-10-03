/**
 * The eternity wheel: the ornament a scribe set beside a heading. Drawn as
 * eight curved arms in a ring, stroked in the page's gold. It makes one full
 * turn over the length of the page, keyed to the scroll (core.css `.wheel`),
 * and stands still under reduced motion. Decorative only.
 */
export default function Wheel({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`wheel ${className}`.trim()}
      viewBox="-32 -32 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <circle r="29" strokeWidth="1.4" />
        <g strokeWidth="3">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <path key={angle} d="M0,-6 C9,-9 15,-17 12,-26" transform={`rotate(${angle})`} />
          ))}
        </g>
        <circle r="3" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}
