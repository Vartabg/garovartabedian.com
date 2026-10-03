#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "../..");
const SOURCE_AUDIO = path.join(
  ROOT,
  "public/scriptures/audio/web/ROM/8.m4a",
);
const SOURCE_ART = path.join(ROOT, "public/worlds/scriptures.jpg");
const OUTPUT_DIR = path.join(ROOT, "public/social/romans-8");
const REGULAR_FONT = path.join(
  ROOT,
  "node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2",
);
const BOLD_FONT = path.join(
  ROOT,
  "node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2",
);

const COLORS = {
  vellum: "#111519",
  folio: "#1b2025",
  ivory: "#f1eee7",
  muted: "#bbb5aa",
  gold: "#d6b66f",
  lapis: "#8fb4dd",
};

const DURATION = 27;
const AUDIO_OFFSET = 1.6;
const AUDIO_START = 350.78;
const AUDIO_DURATION = 22.63;
const FPS = 30;

const scenes = [
  {
    id: "intro",
    start: 0,
    end: 1.72,
    kind: "intro",
    eyebrow: "ROMANS 8:38–39",
    lines: [
      { text: "NOTHING CAN", color: "ivory" },
      { text: "SEPARATE US", color: "gold" },
    ],
    note: "WORLD ENGLISH BIBLE",
  },
  {
    id: "persuaded",
    start: 1.5,
    end: 3.32,
    lines: [
      { text: "FOR I AM PERSUADED", color: "ivory" },
      { text: "THAT", color: "gold" },
    ],
  },
  {
    id: "death-life",
    start: 3.16,
    end: 5.34,
    lines: [
      { text: "NEITHER DEATH", color: "gold" },
      { text: "NOR LIFE", color: "ivory" },
    ],
  },
  {
    id: "angels-principalities",
    start: 5.18,
    end: 8.76,
    lines: [
      { text: "NOR ANGELS", color: "ivory" },
      { text: "NOR PRINCIPALITIES", color: "gold" },
    ],
  },
  {
    id: "present-future",
    start: 8.6,
    end: 12.2,
    lines: [
      { text: "NOR THINGS PRESENT", color: "gold" },
      { text: "NOR THINGS TO COME", color: "ivory" },
    ],
  },
  {
    id: "powers",
    start: 12.04,
    end: 13.82,
    lines: [{ text: "NOR POWERS", color: "gold" }],
  },
  {
    id: "height-depth",
    start: 14.18,
    end: 16.46,
    lines: [
      { text: "NOR HEIGHT", color: "ivory" },
      { text: "NOR DEPTH", color: "gold" },
    ],
  },
  {
    id: "created",
    start: 16.3,
    end: 18.44,
    lines: [
      { text: "NOR ANY OTHER", color: "ivory" },
      { text: "CREATED THING", color: "gold" },
    ],
  },
  {
    id: "separate",
    start: 18.28,
    end: 20.2,
    lines: [
      { text: "WILL BE ABLE TO", color: "ivory" },
      { text: "SEPARATE US", color: "gold" },
    ],
  },
  {
    id: "love",
    start: 20.04,
    end: 21.28,
    lines: [{ text: "FROM GOD’S LOVE", color: "gold" }],
  },
  {
    id: "christ",
    start: 21.12,
    end: 24.08,
    lines: [
      { text: "WHICH IS IN CHRIST JESUS", color: "ivory" },
      { text: "OUR LORD", color: "gold" },
    ],
  },
  {
    id: "outro",
    start: 23.92,
    end: DURATION,
    kind: "outro",
    eyebrow: "ROMANS 8:38–39",
    lines: [
      { text: "NOTHING CAN", color: "ivory" },
      { text: "SEPARATE US.", color: "gold" },
    ],
    note: "HEAR ROMANS 8 IN FULL",
  },
];

const subtitles = [
  [1.6, 3.24, "For I am persuaded that"],
  [3.24, 5.24, "neither death, nor life,"],
  [5.24, 8.66, "nor angels, nor principalities,"],
  [8.66, 12.1, "nor things present, nor things to come, nor powers,"],
  [14.28, 16.36, "nor height, nor depth,"],
  [16.36, 18.34, "nor any other created thing"],
  [18.34, 20.1, "will be able to separate us"],
  [20.1, 21.18, "from God’s love"],
  [21.18, 23.84, "which is in Christ Jesus our Lord."],
];

const formats = [
  {
    id: "linkedin",
    width: 1080,
    height: 1350,
    focusX: 0.36,
    filename: "romans-8-38-39-linkedin.mp4",
    thumbnail: "romans-8-38-39-linkedin-thumbnail.jpg",
  },
  {
    id: "facebook-reel",
    width: 1080,
    height: 1920,
    focusX: 0.32,
    filename: "romans-8-38-39-facebook-reel.mp4",
    thumbnail: "romans-8-38-39-facebook-reel-thumbnail.jpg",
  },
];

function assertInputs() {
  for (const input of [SOURCE_AUDIO, SOURCE_ART, REGULAR_FONT, BOLD_FONT]) {
    if (!existsSync(input)) {
      throw new Error(`Required input is missing: ${input}`);
    }
  }
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fontFaceCss() {
  const regular = readFileSync(REGULAR_FONT).toString("base64");
  const bold = readFileSync(BOLD_FONT).toString("base64");
  return `
    @font-face {
      font-family: "Atkinson";
      src: url(data:font/woff2;base64,${regular}) format("woff2");
      font-weight: 400;
    }
    @font-face {
      font-family: "Atkinson";
      src: url(data:font/woff2;base64,${bold}) format("woff2");
      font-weight: 700;
    }
  `;
}

function overlaySvg(format, scene) {
  const { width, height } = format;
  const edge = Math.round(width * 0.074);
  const titleSize = Math.round(width * 0.024);
  const mainSize = Math.round(width * (scene.kind ? 0.075 : 0.066));
  const lineHeight = Math.round(mainSize * 1.18);
  const centerY = Math.round(height * (format.id === "facebook-reel" ? 0.47 : 0.46));
  const firstY = centerY - ((scene.lines.length - 1) * lineHeight) / 2;
  const footerY = Math.round(
    height * (format.id === "facebook-reel" ? 0.82 : 0.89),
  );
  const noteY = Math.round(height * (format.id === "facebook-reel" ? 0.68 : 0.69));
  const urlY = noteY + Math.round(width * 0.056);
  const lineWidth = Math.round(width * 0.075);
  const headerY = Math.round(height * 0.105);
  const mainLines = scene.lines
    .map(
      (line, index) => `
        <text
          x="${width / 2}"
          y="${firstY + index * lineHeight}"
          text-anchor="middle"
          class="main"
          fill="${COLORS[line.color]}"
        >${escapeXml(line.text)}</text>
      `,
    )
    .join("");
  const outroDetails =
    scene.kind === "outro"
      ? `
        <line x1="${width / 2 - lineWidth}" y1="${noteY - 50}" x2="${width / 2 + lineWidth}" y2="${noteY - 50}" stroke="${COLORS.gold}" stroke-width="3"/>
        <text x="${width / 2}" y="${noteY}" text-anchor="middle" class="note" fill="${COLORS.ivory}">${scene.note}</text>
        <text x="${width / 2}" y="${urlY}" text-anchor="middle" class="url" fill="${COLORS.lapis}">garovartabedian.com/scriptures</text>
      `
      : "";
  const introDetails =
    scene.kind === "intro"
      ? `
        <line x1="${width / 2 - lineWidth}" y1="${noteY - 36}" x2="${width / 2 + lineWidth}" y2="${noteY - 36}" stroke="${COLORS.gold}" stroke-width="3"/>
        <text x="${width / 2}" y="${noteY}" text-anchor="middle" class="note" fill="${COLORS.muted}">${scene.note}</text>
      `
      : "";
  const regularFooter =
    !scene.kind
      ? `
        <text x="${edge}" y="${footerY}" class="footer" fill="${COLORS.gold}">THE ELDER</text>
        <text x="${width - edge}" y="${footerY}" text-anchor="end" class="footer" fill="${COLORS.muted}">GAROVARTABEDIAN.COM</text>
      `
      : "";

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        ${fontFaceCss()}
        text { font-family: "Atkinson", Arial, sans-serif; }
        .eyebrow { font-size: ${titleSize}px; font-weight: 700; letter-spacing: 7px; }
        .main { font-size: ${mainSize}px; font-weight: 700; letter-spacing: 1px; }
        .note { font-size: ${Math.round(width * 0.024)}px; font-weight: 700; letter-spacing: 4px; }
        .url { font-size: ${Math.round(width * 0.028)}px; font-weight: 700; }
        .footer { font-size: ${Math.round(width * 0.019)}px; font-weight: 700; letter-spacing: 3px; }
      </style>
      <defs>
        <linearGradient id="shade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="${COLORS.vellum}" stop-opacity="0.60"/>
          <stop offset="0.25" stop-color="${COLORS.vellum}" stop-opacity="0.30"/>
          <stop offset="0.72" stop-color="${COLORS.vellum}" stop-opacity="0.38"/>
          <stop offset="1" stop-color="${COLORS.vellum}" stop-opacity="0.78"/>
        </linearGradient>
        <radialGradient id="focus" cx="50%" cy="47%" r="47%">
          <stop offset="0" stop-color="${COLORS.folio}" stop-opacity="0.12"/>
          <stop offset="1" stop-color="${COLORS.vellum}" stop-opacity="0.46"/>
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#shade)"/>
      <rect width="${width}" height="${height}" fill="url(#focus)"/>
      <text x="${width / 2}" y="${headerY}" text-anchor="middle" class="eyebrow" fill="${COLORS.gold}">${scene.eyebrow ?? "ROMANS 8:38–39"}</text>
      <line x1="${width / 2 - lineWidth / 2}" y1="${headerY + 28}" x2="${width / 2 + lineWidth / 2}" y2="${headerY + 28}" stroke="${COLORS.gold}" stroke-width="2"/>
      ${mainLines}
      ${introDetails}
      ${outroDetails}
      ${regularFooter}
    </svg>
  `);
}

function cropGeometry(format) {
  const oversizeWidth = Math.round(format.width * 1.08);
  const oversizeHeight = Math.round(format.height * 1.08);
  const sourceWidthAtHeight = Math.round((1200 / 800) * oversizeHeight);
  const left = Math.max(
    0,
    Math.min(
      sourceWidthAtHeight - oversizeWidth,
      Math.round(format.focusX * sourceWidthAtHeight - oversizeWidth / 2),
    ),
  );
  return { oversizeWidth, oversizeHeight, sourceWidthAtHeight, left };
}

async function renderBackground(format, target) {
  const geometry = cropGeometry(format);
  await sharp(SOURCE_ART)
    .resize({
      width: geometry.sourceWidthAtHeight,
      height: geometry.oversizeHeight,
      fit: "fill",
    })
    .extract({
      left: geometry.left,
      top: 0,
      width: geometry.oversizeWidth,
      height: geometry.oversizeHeight,
    })
    .modulate({ brightness: 0.72, saturation: 0.7 })
    .blur(0.45)
    .png()
    .toFile(target);
  return geometry;
}

async function renderOverlays(format, workingDirectory) {
  const paths = [];
  for (const scene of scenes) {
    const target = path.join(
      workingDirectory,
      `${format.id}-${scene.id}.png`,
    );
    await sharp(overlaySvg(format, scene)).png().toFile(target);
    paths.push(target);
  }
  return paths;
}

function timestamp(seconds) {
  const whole = Math.floor(seconds);
  const milliseconds = Math.round((seconds - whole) * 1000);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const remainder = whole % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")},${String(milliseconds).padStart(3, "0")}`;
}

function writeSubtitles() {
  const body = subtitles
    .map(
      ([start, end, text], index) =>
        `${index + 1}\n${timestamp(start)} --> ${timestamp(end)}\n${text}`,
    )
    .join("\n\n");
  writeFileSync(path.join(OUTPUT_DIR, "romans-8-38-39.srt"), `${body}\n`);
}

function renderAudio(workingDirectory) {
  const excerpt = path.join(workingDirectory, "excerpt.wav");
  const socialAudio = path.join(workingDirectory, "social-audio.wav");
  execFileSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      SOURCE_AUDIO,
      "-ss",
      String(AUDIO_START),
      "-t",
      String(AUDIO_DURATION),
      "-ar",
      "44100",
      "-ac",
      "2",
      "-c:a",
      "pcm_s24le",
      excerpt,
    ],
    { stdio: "inherit" },
  );
  execFileSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      excerpt,
      "-af",
      `adelay=${Math.round(AUDIO_OFFSET * 1000)}:all=1,apad=pad_dur=5,loudnorm=I=-16:LRA=7:TP=-1.5,atrim=0:${DURATION}`,
      "-ar",
      "44100",
      "-ac",
      "2",
      "-c:a",
      "pcm_s24le",
      socialAudio,
    ],
    { stdio: "inherit" },
  );
  return socialAudio;
}

async function renderThumbnail(format, background, overlay) {
  const target = path.join(OUTPUT_DIR, format.thumbnail);
  const geometry = cropGeometry(format);
  await sharp(background)
    .extract({
      left: Math.round((geometry.oversizeWidth - format.width) / 2),
      top: Math.round((geometry.oversizeHeight - format.height) / 2),
      width: format.width,
      height: format.height,
    })
    .composite([{ input: overlay }])
    .jpeg({ quality: 91, chromaSubsampling: "4:4:4" })
    .toFile(target);
}

function renderVideo(format, background, overlays, socialAudio) {
  const output = path.join(OUTPUT_DIR, format.filename);
  const geometry = cropGeometry(format);
  const argumentsList = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-loop",
    "1",
    "-framerate",
    String(FPS),
    "-i",
    background,
  ];
  for (const overlay of overlays) {
    argumentsList.push(
      "-loop",
      "1",
      "-framerate",
      String(FPS),
      "-i",
      overlay,
    );
  }
  argumentsList.push("-i", socialAudio);

  const horizontalTravel = Math.round((geometry.oversizeWidth - format.width) * 0.18);
  const verticalTravel = Math.round((geometry.oversizeHeight - format.height) * 0.12);
  const filters = [
    `[0:v]crop=${format.width}:${format.height}:x='(iw-ow)/2+${horizontalTravel}*sin(t/9)':y='(ih-oh)/2-${verticalTravel}*t/${DURATION}',vignette=PI/5,format=rgba[base]`,
  ];
  let previous = "base";
  scenes.forEach((scene, index) => {
    const input = index + 1;
    const fadeOutStart = Math.max(scene.start, scene.end - 0.18);
    filters.push(
      `[${input}:v]format=rgba,fade=t=in:st=${scene.start}:d=0.18:alpha=1,fade=t=out:st=${fadeOutStart}:d=0.18:alpha=1[overlay${index}]`,
    );
    const next = `stage${index}`;
    filters.push(
      `[${previous}][overlay${index}]overlay=0:0:enable='between(t,${scene.start},${scene.end})':eof_action=pass[${next}]`,
    );
    previous = next;
  });
  filters.push(
    `[${previous}]fade=t=in:st=0:d=0.45,fade=t=out:st=26.55:d=0.45,format=yuv420p[video]`,
  );

  const audioInput = overlays.length + 1;
  argumentsList.push(
    "-filter_complex",
    filters.join(";"),
    "-map",
    "[video]",
    "-map",
    `${audioInput}:a`,
    "-t",
    String(DURATION),
    "-r",
    String(FPS),
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "19",
    "-profile:v",
    "high",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "44100",
    "-ac",
    "2",
    "-movflags",
    "+faststart",
    "-metadata",
    "title=Romans 8:38–39 — Nothing Can Separate Us",
    "-metadata",
    "comment=World English Bible narration by The Elder",
    output,
  );
  execFileSync("ffmpeg", argumentsList, { stdio: "inherit" });
}

async function main() {
  assertInputs();
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const workingDirectory = mkdtempSync(
    path.join(tmpdir(), "romans-8-social-"),
  );
  try {
    const socialAudio = renderAudio(workingDirectory);
    writeSubtitles();
    for (const format of formats) {
      const background = path.join(
        workingDirectory,
        `${format.id}-background.png`,
      );
      await renderBackground(format, background);
      const overlays = await renderOverlays(format, workingDirectory);
      await renderThumbnail(format, background, overlays[0]);
      renderVideo(format, background, overlays, socialAudio);
    }
  } finally {
    rmSync(workingDirectory, { recursive: true, force: true });
  }
  console.log(`Created Romans 8 social assets in ${OUTPUT_DIR}`);
}

await main();
