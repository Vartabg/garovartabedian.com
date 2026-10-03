/** The official source stays on YouTube; this site embeds selected time ranges. */
export const CHRISTIANITY_ESSAY_PATH = "/jesus/history/belief-and-growth";
export const EXCERPT_VIDEO_ID = "t6Jrww8kG24";
export const EXCERPT_FRAME_ORIGIN = "https://www.youtube-nocookie.com";

export type VideoExcerpt = {
  id: string;
  title: string;
  quote: string;
  start: number;
  end: number;
};

export function timestamp(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function excerptWatchUrl(start = 0): string {
  return `https://www.youtube.com/watch?v=${EXCERPT_VIDEO_ID}&t=${start}s`;
}

export function excerptEmbedUrl(start: number, end: number): string {
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start) {
    throw new Error("An excerpt needs an ordered range of whole seconds.");
  }
  const params = new URLSearchParams({
    start: String(start),
    end: String(end),
    autoplay: "1",
    playsinline: "1",
    rel: "0",
    cc_load_policy: "1",
    cc_lang_pref: "en",
  });
  return `${EXCERPT_FRAME_ORIGIN}/embed/${EXCERPT_VIDEO_ID}?${params}`;
}
