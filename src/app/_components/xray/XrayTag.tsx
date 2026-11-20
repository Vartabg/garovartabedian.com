import type { XrayTagSpec } from "@/lib/scriptures/xray-types";

/**
 * One Engineer-lens tag: a label, the facts, and the detail behind a
 * disclosure. Always in the DOM; discovery.css shows it only under
 * html[data-site-lens="engineer"], so Reader mode never shifts.
 */
export default function XrayTag({ id, label, facts, detail }: XrayTagSpec) {
  return (
    <div className="xray-tag" data-xray={id}>
      <p>
        <strong>{label}</strong> · {facts.join(" · ")}
      </p>
      {detail.length > 0 && (
        <details>
          <summary>Where this comes from</summary>
          {detail.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </details>
      )}
    </div>
  );
}
