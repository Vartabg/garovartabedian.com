/**
 * The Didache's own structure, drawn: one road that forks into the Way of
 * Life and the Way of Death. Pure decoration for the reader page — the text
 * says it; this shows it.
 */
export default function TwoWays() {
  return (
    <svg
      viewBox="0 0 720 200"
      className="ew-twoways"
      role="img"
      aria-label="A road forking into two ways: the way of life rising, the way of death descending — the Didache's opening image"
    >
      <path d="M 20 120 C 120 120 200 118 300 110" className="ew-tw-road" fill="none" />
      <path
        d="M 300 110 C 420 92 540 70 690 38"
        className="ew-tw-road life"
        fill="none"
      />
      <path
        d="M 300 110 C 420 130 540 152 690 176"
        className="ew-tw-road death"
        fill="none"
      />
      <circle cx="300" cy="110" r="5" className="ew-tw-fork" />
      <text x="695" y="34" textAnchor="end" className="ew-tw-label life">
        the Way of Life
      </text>
      <text x="695" y="192" textAnchor="end" className="ew-tw-label death">
        the Way of Death
      </text>
      <text x="24" y="106" className="ew-tw-label">
        every reader starts here
      </text>
    </svg>
  );
}
