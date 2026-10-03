export default function HistoryEvidenceBoundary({
  establishes,
  limits,
}: {
  establishes: string[];
  limits: string;
}) {
  return (
    <div className="jsu-evidence-boundary">
      <div>
        <strong>What this establishes</strong>
        <ul>{establishes.map((claim) => <li key={claim}>{claim}</li>)}</ul>
      </div>
      <div className="is-limit">
        <strong>What this does not establish</strong>
        <p>{limits}</p>
      </div>
    </div>
  );
}
