/** Shared prompt tails — keep in sync with docs/media-lanes.md */

export const LANE_A_TAIL =
  "Cinematic photorealistic biblical scene, dramatic natural lighting, rich material " +
  "textures on wood stone linen and leather, Mediterranean antiquity, shallow depth of " +
  "field, no readable text, no modern objects, no logos, no watermark.";

export const LANE_B_EARLY_TAIL =
  "Verdigris and ochre on aged parchment, stylized symbolic fresco style, lamplit, " +
  "horizontal wide 16:9 frieze (not square), flat tempera manuscript leaf, " +
  "no readable text, no letters, no glyphs, no inscriptions, no photorealistic faces, " +
  "no watermark, no signature, no logo, no modern elements.";

export const LANE_B_JESUS_TAIL =
  "Wine-red and gold on aged parchment, stylized gospel fresco style, first-century " +
  "Mediterranean setting, lamplit, no readable text, no letters, no glyphs, no inscriptions, " +
  "no photorealistic faces, no modern elements.";

export const LANE_B_ANGELS_TAIL =
  "Midnight blue, gold, and ember on aged parchment, stylized apocalyptic manuscript " +
  "illumination, symbolic unseen realm, lamplit, no readable text, no letters, no glyphs, " +
  "no inscriptions, no photorealistic faces, no modern elements.";

export const LANE_B_CHURCH_TAIL =
  "Stone, parchment, candlelight, and icon-gold, stylized church-history manuscript " +
  "illumination, council hall or ancient city setting, no readable text, no letters, " +
  "no glyphs, no inscriptions, no photorealistic faces, no modern elements.";

/** Lane B prefix for scroll-length reading plates (16:9). */
export function laneBPrompt({ room, summary, theme, source }) {
  const rooms = {
    angels: {
      label: "Apocalyptic manuscript illumination miniature",
      tail: LANE_B_ANGELS_TAIL,
    },
    church: {
      label: "Church history manuscript illumination miniature",
      tail: LANE_B_CHURCH_TAIL,
    },
    early: {
      label: "Early Christian manuscript illumination miniature",
      tail: LANE_B_EARLY_TAIL,
    },
    jesus: {
      label: "Gospel manuscript illumination miniature",
      tail: LANE_B_JESUS_TAIL,
    },
  };
  const config = rooms[room] ?? rooms.early;
  return (
    `${config.label}, wide 16:9: ${summary} ` +
    `Visual theme: "${theme}". ` +
    `Source room: ${source}. ` +
    config.tail
  );
}
