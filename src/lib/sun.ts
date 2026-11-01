/**
 * Where the sun is over Jerusalem, and what that light looks like.
 *
 * The front door's gold leaf is lit from the sun's real position. This is the
 * low-precision solar ephemeris (Astronomical Almanac / NOAA form): good to a
 * fraction of a degree, which is far finer than anything the page can show.
 * Pure functions only, so the numbers are testable without a browser.
 */

export const JERUSALEM = { lat: 31.7683, lon: 35.2137, timeZone: "Asia/Jerusalem" } as const;

const RAD = Math.PI / 180;

export type SunPosition = {
  /** Degrees above (+) or below (−) the horizon. */
  elevation: number;
  /** Degrees clockwise from true north. */
  azimuth: number;
};

export function sunPosition(date: Date, lat: number = JERUSALEM.lat, lon: number = JERUSALEM.lon): SunPosition {
  const n = date.getTime() / 86_400_000 + 2_440_587.5 - 2_451_545.0;
  const meanLongitude = mod(280.46 + 0.9856474 * n, 360);
  const meanAnomaly = mod(357.528 + 0.9856003 * n, 360) * RAD;
  const eclipticLongitude =
    (meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) * RAD;
  const obliquity = (23.439 - 0.0000004 * n) * RAD;
  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticLongitude),
    Math.cos(eclipticLongitude),
  );
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude));
  const siderealHours = mod(18.697374558 + 24.06570982441908 * n, 24);
  const hourAngle = (siderealHours * 15 + lon) * RAD - rightAscension;
  const latitude = lat * RAD;
  const elevation = Math.asin(
    Math.sin(latitude) * Math.sin(declination) +
      Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle),
  );
  const azimuth = Math.atan2(
    -Math.sin(hourAngle),
    Math.cos(latitude) * Math.tan(declination) - Math.sin(latitude) * Math.cos(hourAngle),
  );
  return { elevation: elevation / RAD, azimuth: mod(azimuth / RAD, 360) };
}

export type Rgb = readonly [number, number, number];

export type SkyLight = {
  /** Colour of direct light (linear-ish 0..1). */
  color: Rgb;
  /** Strength of direct light. */
  strength: number;
  /** Skylight that reaches everything. */
  ambient: Rgb;
};

/** Night, twilight, golden hour, day — keyed by solar elevation in degrees. */
const SKY: ReadonlyArray<SkyLight & { elevation: number }> = [
  { elevation: -18, color: [0.22, 0.28, 0.5], strength: 0.1, ambient: [0.035, 0.04, 0.08] },
  { elevation: -9, color: [0.34, 0.32, 0.62], strength: 0.2, ambient: [0.075, 0.075, 0.14] },
  { elevation: -3, color: [0.86, 0.48, 0.58], strength: 0.42, ambient: [0.18, 0.145, 0.2] },
  { elevation: 1, color: [1, 0.62, 0.32], strength: 1.1, ambient: [0.43, 0.33, 0.27] },
  { elevation: 8, color: [1, 0.8, 0.55], strength: 1.1, ambient: [0.46, 0.4, 0.34] },
  { elevation: 25, color: [1, 0.94, 0.83], strength: 1.1, ambient: [0.47, 0.455, 0.43] },
  { elevation: 70, color: [1, 0.98, 0.95], strength: 1.12, ambient: [0.5, 0.5, 0.495] },
];

export function skyLight(elevation: number): SkyLight {
  if (elevation <= SKY[0].elevation) return SKY[0];
  for (let i = 1; i < SKY.length; i++) {
    const b = SKY[i];
    if (elevation > b.elevation) continue;
    const a = SKY[i - 1];
    const t = (elevation - a.elevation) / (b.elevation - a.elevation);
    const s = t * t * (3 - 2 * t);
    const mix = (x: Rgb, y: Rgb): Rgb => [x[0] + (y[0] - x[0]) * s, x[1] + (y[1] - x[1]) * s, x[2] + (y[2] - x[2]) * s];
    return { color: mix(a.color, b.color), strength: a.strength + (b.strength - a.strength) * s, ambient: mix(a.ambient, b.ambient) };
  }
  return SKY[SKY.length - 1];
}

/**
 * Light direction on the page: x east (right), y north (up), z toward the
 * reader. The leaf is held up toward the reader, so even a low sun reaches
 * it; below the horizon only skylight remains.
 */
export function lightDirection({ elevation, azimuth }: SunPosition): Rgb {
  const flat = Math.cos(elevation * RAD);
  const z = elevation >= 0 ? 0.32 + 0.68 * Math.sin(elevation * RAD) : Math.max(0.12, 0.32 + elevation * 0.025);
  return [Math.sin(azimuth * RAD) * flat, Math.cos(azimuth * RAD) * flat, z];
}

/** 0 by day, 1 in full night. */
export function nightness(elevation: number): number {
  return Math.min(1, Math.max(0, (-2 - elevation) / 8));
}

/** Rough brightness of the lit vellum, used to choose dark or light ink. */
export function leafBrightness(elevation: number): number {
  const light = skyLight(elevation);
  const z = lightDirection({ elevation, azimuth: 180 })[2];
  const ambient = (light.ambient[0] + light.ambient[1] + light.ambient[2]) / 3;
  return (0.86 * (ambient + light.strength * z * 0.95)) / 1.2 + nightness(elevation) * 0.06;
}

export function compassPoint(azimuth: number): string {
  const points = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
  return points[Math.round(mod(azimuth, 360) / 45) % 8];
}

function mod(value: number, by: number) {
  return ((value % by) + by) % by;
}
