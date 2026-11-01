import type { ReactNode } from "react";

/** Keep the map's task and its equivalent HTML controls together. */
export default function MapGuide({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="map-guide">
      <p className="map-guide-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </p>
      <div className="map-guide-controls">{children}</div>
    </div>
  );
}

/** Server-rendered map links stay usable before JavaScript loads. */
export function MapDestinations({
  label,
  items,
}: {
  label: string;
  items: { href: string; label: string; detail?: string }[];
}) {
  return (
    <nav className="map-destinations" aria-label={label}>
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <a href={item.href}>
              <span>{item.label}</span>
              {item.detail ? <small>{item.detail}</small> : null}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
