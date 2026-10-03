"use client";

import type { LifeData, LifeEvent } from "@/lib/jesus/types";
import { useTranslation } from "@/lib/i18n";
import { PLACE_BY_ID } from "./geo";

export default function LifeDataTable({ data }: { data: LifeData }) {
  const { t } = useTranslation();
  const places = Array.from(PLACE_BY_ID.entries()).sort(([, a], [, b]) =>
    a.name.localeCompare(b.name),
  );

  return (
    <details className="jsu-life-data-table">
      <summary>{t("life.dataTable.title")}</summary>
      <div className="jsu-life-data-table-body">
        <h2>{t("life.dataTable.title")}</h2>
        <p>{t("life.dataTable.description")}</p>

        {data.eras.map((era) => {
          const events = data.events.filter((e) => e.era === era.id);
          if (events.length === 0) return null;
          const eraName = t(`life.era.${era.id}.name`);

          return (
            <section key={era.id} style={{ marginBottom: "2rem" }}>
              <h3>{eraName}</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        paddingBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      {t("life.dataTable.eventTable", { eraName })}
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        paddingBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      {t("life.narrative.location")}
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        paddingBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      {t("life.narrative.modernSite")}
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        paddingBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      {t("life.narrative.coordinates")}
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        paddingBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      {t("life.dataTable.descriptionHeader")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event: LifeEvent) => {
                    const place = PLACE_BY_ID.get(event.place);
                    return (
                      <tr
                        key={event.id}
                        style={{ borderBottom: "1px solid #ddd" }}
                      >
                        <td
                          style={{
                            paddingBottom: "0.5rem",
                            paddingRight: "1rem",
                          }}
                        >
                          {event.title}
                        </td>
                        <td
                          style={{
                            paddingBottom: "0.5rem",
                            paddingRight: "1rem",
                          }}
                        >
                          {place?.name || event.place}
                        </td>
                        <td
                          style={{
                            paddingBottom: "0.5rem",
                            paddingRight: "1rem",
                          }}
                        >
                          {place?.modern}
                        </td>
                        <td
                          style={{
                            paddingBottom: "0.5rem",
                            paddingRight: "1rem",
                          }}
                        >
                          {place
                            ? `${place.lat.toFixed(3)}°N, ${place.lng.toFixed(3)}°E`
                            : "—"}
                        </td>
                        <td style={{ paddingBottom: "0.5rem" }}>
                          {event.line}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          );
        })}

        <section style={{ marginTop: "2rem" }}>
          <h3>{t("life.dataTable.placeReference")}</h3>
          <p>{t("life.dataTable.allPlaces")}</p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    paddingBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  {t("life.dataTable.biblicalName")}
                </th>
                <th
                  style={{
                    textAlign: "left",
                    paddingBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  {t("life.dataTable.modernLocation")}
                </th>
                <th
                  style={{
                    textAlign: "left",
                    paddingBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  {t("life.dataTable.region")}
                </th>
                <th
                  style={{
                    textAlign: "left",
                    paddingBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  {t("life.dataTable.coordinatesHeader")}
                </th>
              </tr>
            </thead>
            <tbody>
              {places.map(([id, place]) => (
                <tr key={id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td
                    style={{
                      paddingBottom: "0.5rem",
                      paddingRight: "1rem",
                      fontWeight: "bold",
                    }}
                  >
                    {place.name}
                  </td>
                  <td style={{ paddingBottom: "0.5rem", paddingRight: "1rem" }}>
                    {place.modern}
                  </td>
                  <td style={{ paddingBottom: "0.5rem", paddingRight: "1rem" }}>
                    {place.today}
                  </td>
                  <td style={{ paddingBottom: "0.5rem" }}>
                    {place.lat.toFixed(3)}°N, {place.lng.toFixed(3)}°E
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </details>
  );
}
