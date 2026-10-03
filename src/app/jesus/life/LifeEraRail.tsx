import type { CSSProperties } from "react";
import type { LifeData } from "@/lib/jesus/types";
import { useTranslation } from "@/lib/i18n";

export function LifeEraRail({
  activeEra,
  data,
}: {
  activeEra: string | null;
  data: LifeData;
}) {
  const { t } = useTranslation();
  const rows = data.eras.map((era) => {
    const events = data.events.filter((event) => event.era === era.id);
    return {
      ...era,
      name: t(`life.era.${era.id}.name`),
      events,
      refs: events.reduce((sum, event) => sum + event.refs.length, 0),
    };
  });
  const max = Math.max(1, ...rows.map((row) => row.events.length));
  const placeCount = new Set(data.events.map((event) => event.place)).size;

  return (
    <nav className="jsu-life-rail" aria-label={t("life.rail.label")}>
      <div className="jsu-visual-head">
        <strong>{t("life.rail.shapeOfLife")}</strong>
        <span>
          {t("life.rail.summary", {
            eventCount: data.events.length,
            placeCount,
            refCount: data.events.reduce((sum, event) => sum + event.refs.length, 0),
          })}
        </span>
      </div>
      <div className="jsu-life-rail-track">
        {rows.map((row) => (
          <a
            key={row.id}
            href={`#life-era-${row.id}`}
            className={`jsu-life-era${activeEra === row.id ? " is-active" : ""}`}
            style={
              { "--h": `${Math.max(22, (row.events.length / max) * 100)}%` } as CSSProperties
            }
            aria-current={activeEra === row.id ? "location" : undefined}
            aria-label={t("life.rail.eraAriaLabel", {
              eraName: row.name,
              eventCount: row.events.length,
              refCount: row.refs,
            })}
          >
            <span className="jsu-life-era-bar" />
            <strong>{row.name}</strong>
            <span>{row.events.length} events · {row.refs} refs</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
