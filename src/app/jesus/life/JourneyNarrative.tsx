"use client";

import type { LifeData } from "@/lib/jesus/types";
import { useTranslation } from "@/lib/i18n";
import { PLACE_BY_ID } from "./geo";
import AttestationRow from "./AttestationRow";

function getCardinalDirection(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): string {
  const dLat = toLat - fromLat;
  const dLng = toLng - fromLng;
  const angle = Math.atan2(dLng, dLat) * (180 / Math.PI);

  if (angle > -22.5 && angle <= 22.5) return "north";
  if (angle > 22.5 && angle <= 67.5) return "northeast";
  if (angle > 67.5 && angle <= 112.5) return "east";
  if (angle > 112.5 && angle <= 157.5) return "southeast";
  if (angle > 157.5 || angle <= -157.5) return "south";
  if (angle > -157.5 && angle <= -112.5) return "southwest";
  if (angle > -112.5 && angle <= -67.5) return "west";
  return "northwest";
}

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function JourneyNarrative({ data }: { data: LifeData }) {
  const { t } = useTranslation();

  return (
    <section className="jsu-journey-narrative">
      <h2>{t("life.narrative.sectionTitle")}</h2>
      <p className="jsu-journey-intro">
        {t("life.narrative.intro")}
      </p>

      {data.eras.map((era) => {
        const eraEvents = data.events
          .filter((event) => event.era === era.id)
          .flatMap((event) => {
            const place = PLACE_BY_ID.get(event.place);
            return place ? [{ event, place }] : [];
          });
        return (
          <section key={era.id} className="jsu-narrative-era">
            <h3>{t(`life.era.${era.id}.name`)}</h3>
            <div className="jsu-narrative-events">
              {eraEvents.map(({ event, place }, idx) => {
                const previousPlace = eraEvents[idx - 1]?.place;
                let direction = "";
                let distance = 0;
                if (previousPlace) {
                  direction = getCardinalDirection(
                    previousPlace.lat,
                    previousPlace.lng,
                    place.lat,
                    place.lng
                  );
                  distance = calculateDistance(
                    previousPlace.lat,
                    previousPlace.lng,
                    place.lat,
                    place.lng
                  );
                }

                return (
                  <article key={event.id} className="jsu-narrative-event">
                    <h4>{event.title}</h4>

                    {idx > 0 && previousPlace && (
                      <p className="jsu-narrative-journey">
                        {t("life.narrative.travel", {
                          direction: direction,
                          distance: distance,
                          distanceMiles: Math.round(distance / 1.609),
                        })}
                      </p>
                    )}

                    <div className="jsu-narrative-place">
                      <p>
                        <strong>{t("life.narrative.location")}</strong> {place.name}
                      </p>
                      <p>
                        <strong>{t("life.narrative.modernSite")}</strong> {place.modern} ({place.today})
                      </p>
                      <p>
                        <strong>{t("life.narrative.coordinates")}</strong> {place.lat.toFixed(4)}° N,{" "}
                        {place.lng.toFixed(4)}° E
                      </p>
                    </div>

                    <p className="jsu-narrative-description">{event.line}</p>

                    {event.refs.length > 0 && (
                      <p className="jsu-narrative-refs">
                        <strong>{t("life.narrative.scripture")}</strong>{" "}
                        {event.refs.map((ref, refIdx) => (
                          <span key={ref.ref}>
                            {ref.ref}
                            {refIdx < event.refs.length - 1 ? "; " : ""}
                          </span>
                        ))}
                      </p>
                    )}

                    <AttestationRow event={event} />
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="jsu-narrative-summary">
        <h3>{t("life.narrative.geographicOverview")}</h3>
        <p>
          {t("life.narrative.geographicOverviewText")}
        </p>
        <p>
          {t("life.narrative.narrativeNote")}
        </p>
      </section>
    </section>
  );
}
