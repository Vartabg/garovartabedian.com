import type { ReactNode } from "react";

export type WorldPreviewKind =
  | "canon"
  | "search"
  | "topics"
  | "words"
  | "thread"
  | "inkstone"
  | "map"
  | "gallery"
  | "timeline"
  | "route"
  | "books"
  | "era"
  | "tree"
  | "council"
  | "faces"
  | "giants"
  | "ladder"
  | "fall"
  | "encounters"
  | "demons"
  | "fence"
  | "free"
  | "cases";

const spines = [16, 22, 14, 34, 19, 42, 25, 17, 31, 20, 13, 38, 21, 28, 15, 24];

function MiniCanon() {
  return (
    <>
      <line x1="24" y1="92" x2="296" y2="92" className="vp-line" />
      {spines.map((h, i) => (
        <rect
          key={i}
          x={34 + i * 15}
          y={92 - h}
          width={9}
          height={h}
          rx="2"
          className={i > 10 ? "vp-fill alt" : "vp-fill"}
        />
      ))}
      <line x1="54" y1="58" x2="266" y2="58" className="vp-thread" />
      <circle cx="92" cy="58" r="4" className="vp-dot" />
      <circle cx="188" cy="58" r="4" className="vp-dot" />
      <circle cx="254" cy="58" r="4" className="vp-dot" />
    </>
  );
}

function MiniSearch() {
  return (
    <>
      <rect x="38" y="28" width="204" height="24" rx="12" className="vp-panel" />
      <circle cx="62" cy="40" r="8" className="vp-ring" />
      <line x1="68" y1="46" x2="78" y2="56" className="vp-line strong" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <line x1="54" y1={72 + i * 10} x2={254 - i * 18} y2={72 + i * 10} className="vp-line" />
          <rect x={128 + i * 15} y={68 + i * 10} width="38" height="7" rx="3" className="vp-fill alt" />
        </g>
      ))}
    </>
  );
}

function MiniTopics() {
  return (
    <>
      <path d="M70 86 C112 46 172 108 236 44" className="vp-thread" />
      {["A", "F", "G", "J", "L"].map((letter, i) => (
        <g key={letter}>
          <circle cx={58 + i * 50} cy={78 - (i % 2) * 26} r="16" className="vp-panel" />
          <text x={58 + i * 50} y={82 - (i % 2) * 26} textAnchor="middle" className="vp-label">
            {letter}
          </text>
        </g>
      ))}
      <line x1="78" y1="94" x2="248" y2="94" className="vp-line" />
    </>
  );
}

function MiniWords() {
  return (
    <>
      <path d="M62 30 h38 v32 h-20 l-11 17 v-17 h-7 Z" className="vp-panel" />
      <path d="M132 34 h128" className="vp-line" />
      <path d="M132 52 h104" className="vp-line" />
      <path d="M132 70 h132" className="vp-line" />
      <path d="M132 88 h82" className="vp-fill-stroke" />
      <circle cx="82" cy="46" r="5" className="vp-dot alt" />
    </>
  );
}

function MiniThread() {
  return (
    <>
      <rect x="34" y="28" width="108" height="68" rx="8" className="vp-panel" />
      <rect x="178" y="28" width="108" height="68" rx="8" className="vp-panel" />
      <path d="M82 52 C122 20 196 94 238 56" className="vp-thread" />
      <path d="M58 50 h54 M58 68 h38 M202 50 h54 M202 68 h44" className="vp-line" />
      <circle cx="82" cy="52" r="4" className="vp-dot" />
      <circle cx="238" cy="56" r="4" className="vp-dot" />
    </>
  );
}

function MiniInkStone() {
  return (
    <>
      <line x1="42" y1="82" x2="278" y2="82" className="vp-line" />
      <rect x="62" y="38" width="68" height="32" rx="3" className="vp-panel" />
      <circle cx="170" cy="82" r="5" className="vp-dot" />
      <circle cx="204" cy="82" r="5" className="vp-dot" />
      <circle cx="236" cy="82" r="5" className="vp-dot" />
      <line x1="170" y1="54" x2="170" y2="82" className="vp-thread" />
      <line x1="204" y1="42" x2="204" y2="82" className="vp-thread" />
      <line x1="236" y1="62" x2="236" y2="82" className="vp-thread" />
    </>
  );
}

function MiniMap() {
  return (
    <>
      <path d="M72 18 C64 56 82 85 72 112 H292 V18 Z" className="vp-land" />
      <path d="M206 34 C220 28 236 40 232 56 C228 72 208 72 202 58 C198 48 198 38 206 34 Z" className="vp-water" />
      <path d="M210 70 C204 86 216 96 210 110" className="vp-river" />
      <path d="M118 92 C142 58 184 58 214 44 C244 30 250 58 232 78 C210 104 160 80 130 98" className="vp-thread" />
      <circle cx="118" cy="92" r="4" className="vp-dot" />
      <circle cx="214" cy="44" r="4" className="vp-dot" />
      <circle cx="232" cy="78" r="4" className="vp-dot" />
    </>
  );
}

function MiniGallery() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={48 + i * 72} y={24 + (i % 2) * 10} width="54" height="70" rx="4" className="vp-panel" />
          <circle cx={75 + i * 72} cy={54 + (i % 2) * 10} r="12" className="vp-ring" />
          <path d={`M${60 + i * 72} ${82 + (i % 2) * 10} C72 ${68 + (i % 2) * 10} 86 ${68 + (i % 2) * 10} 96 ${82 + (i % 2) * 10}`} className="vp-line" />
        </g>
      ))}
    </>
  );
}

function MiniTimeline() {
  return (
    <>
      {[32, 58, 84].map((y) => (
        <line key={y} x1="38" y1={y} x2="282" y2={y} className="vp-line" />
      ))}
      <rect x="62" y="27" width="66" height="10" rx="5" className="vp-fill" />
      <rect x="152" y="53" width="86" height="10" rx="5" className="vp-fill alt" />
      <circle cx="106" cy="84" r="5" className="vp-dot" />
      <rect x="186" y="79" width="54" height="10" rx="5" className="vp-fill" />
      {[80, 160, 240].map((x) => (
        <line key={x} x1={x} y1="22" x2={x} y2="98" className="vp-grid" />
      ))}
    </>
  );
}

function MiniRoute() {
  return (
    <>
      <path d="M42 30 C82 46 94 76 124 92 C146 78 158 52 196 44 C236 36 266 50 290 72" className="vp-land" />
      <path d="M72 90 C112 62 156 88 194 58 C230 30 256 54 276 74" className="vp-thread" />
      <path d="M202 58 C166 36 134 48 98 82" className="vp-letter" />
      <path d="M202 58 C234 66 254 54 276 74" className="vp-letter" />
      {[72, 202, 276].map((x, i) => (
        <circle key={x} cx={x} cy={[90, 58, 74][i]} r="5" className="vp-dot" />
      ))}
    </>
  );
}

function MiniBooks() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x={62 + i * 34}
          y={28 + i * 3}
          width="24"
          height={68 - i * 3}
          rx="4"
          className={i % 2 ? "vp-fill alt" : "vp-fill"}
        />
      ))}
      <path d="M52 96 h210" className="vp-line strong" />
      <path d="M222 38 h42 M222 56 h54 M222 74 h36" className="vp-line" />
    </>
  );
}

function MiniEra() {
  return (
    <>
      <line x1="36" y1="58" x2="284" y2="58" className="vp-line strong" />
      {[44, 82, 118, 166, 224].map((x, i) => (
        <rect key={x} x={x} y="51" width={[34, 28, 44, 54, 50][i]} height="14" rx="7" className={i % 2 ? "vp-fill alt" : "vp-fill"} />
      ))}
      {[96, 148, 212].map((x) => (
        <path key={x} d={`M${x} 66 v14 m0 0 l-8 10 m8-10 l8 10`} className="vp-thread" />
      ))}
      <path d="M44 35 v12 M116 35 v12 M202 35 v12 M272 35 v12" className="vp-line" />
    </>
  );
}

function MiniTree() {
  return (
    <>
      <path d="M38 60 H152 C174 60 176 42 196 42 H284" className="vp-branch trunk" />
      <path d="M152 60 C174 60 176 78 196 78 H284" className="vp-branch" />
      <path d="M198 42 C214 42 216 28 234 28 H284" className="vp-branch" />
      <path d="M198 78 C214 78 216 96 234 96 H284" className="vp-branch" />
      <circle cx="152" cy="60" r="5" className="vp-dot" />
      <circle cx="198" cy="42" r="4" className="vp-dot alt" />
      <circle cx="198" cy="78" r="4" className="vp-dot alt" />
    </>
  );
}

function MiniCouncil() {
  return (
    <>
      <path d="M54 30 C84 48 94 82 122 98 C104 104 76 90 66 62 C58 46 50 36 54 30 Z" className="vp-land" />
      <path d="M188 30 C232 20 276 38 292 60 C302 92 274 106 246 92 C220 78 190 82 180 58 C174 44 178 36 188 30 Z" className="vp-land" />
      <path d="M148 48 C176 44 188 58 178 78 C166 96 136 84 132 62 C130 52 136 48 148 48 Z" className="vp-land" />
      {[210, 226, 244, 260].map((x, i) => (
        <circle key={x} cx={x} cy={58 + i * 6} r="5" className="vp-dot" />
      ))}
      <circle cx="82" cy="62" r="5" className="vp-dot alt" />
      <circle cx="100" cy="38" r="5" className="vp-dot alt" />
    </>
  );
}

function MiniFaces() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={54 + i * 70} y={28 + (i === 1 ? 8 : 0)} width="48" height="62" rx="24" className="vp-panel" />
          <circle cx={78 + i * 70} cy={52 + (i === 1 ? 8 : 0)} r="10" className="vp-ring" />
          <path d={`M64 ${78 + (i === 1 ? 8 : 0)} C74 ${68 + (i === 1 ? 8 : 0)} 86 ${68 + (i === 1 ? 8 : 0)} 96 ${78 + (i === 1 ? 8 : 0)}`} className="vp-line" />
        </g>
      ))}
      <line x1="52" y1="100" x2="244" y2="100" className="vp-line" />
    </>
  );
}

function MiniLadder() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={70 + i * 12} y={24 + i * 15} width={180 - i * 24} height="11" rx="6" className={i > 2 ? "vp-fill ember" : "vp-fill"} />
      ))}
      <path d="M160 18 V104" className="vp-thread" />
      {[54, 270, 248, 42, 280].map((x, i) => (
        <circle key={i} cx={x} cy={28 + i * 15} r="2" className="vp-dot" />
      ))}
    </>
  );
}

function MiniFall() {
  return (
    <>
      <path d="M160 18 C130 42 194 54 160 78 C136 94 160 106 160 106" className="vp-thread" />
      {[18, 42, 64, 86, 106].map((y, i) => (
        <circle key={y} cx={i % 2 ? 142 : 160} cy={y} r={i === 0 ? 6 : 5} className={i > 1 ? "vp-dot ember" : "vp-dot"} />
      ))}
      <path d="M72 26 h56 M190 88 h58 M190 102 h42" className="vp-line" />
    </>
  );
}

function MiniEncounters() {
  return (
    <>
      <line x1="72" y1="38" x2="274" y2="38" className="vp-line" />
      <line x1="72" y1="82" x2="274" y2="82" className="vp-line" />
      {[96, 154, 218, 252].map((x) => (
        <circle key={x} cx={x} cy="38" r="5" className="vp-dot" />
      ))}
      {[118, 174, 232].map((x) => (
        <circle key={x} cx={x} cy="82" r="5" className="vp-dot ember" />
      ))}
      <path d="M52 38 h14 M52 82 h14" className="vp-line strong" />
    </>
  );
}

function MiniDemons() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={52 + i * 72} y={30 + i * 7} width="56" height="56" rx="8" className="vp-panel dark" />
      ))}
      <path d="M66 50 h28 M66 66 h20 M138 58 h34 M138 74 h22 M214 64 h28 M214 80 h18" className="vp-line ember" />
      <circle cx="92" cy="88" r="4" className="vp-dot ember" />
      <circle cx="166" cy="96" r="4" className="vp-dot ember" />
    </>
  );
}

function MiniFence() {
  return (
    <>
      {[70, 118, 166, 214, 262].map((x) => (
        <path key={x} d={`M${x} 30 v70 M${x - 16} 46 h32 M${x - 16} 72 h32`} className="vp-fence-post" />
      ))}
      <line x1="42" y1="96" x2="278" y2="96" className="vp-line" />
      <path d="M54 34 h92 M168 34 h92" className="vp-fenced" />
      <path d="M54 108 h84 M172 108 h92" className="vp-free" />
    </>
  );
}

function MiniFree() {
  return (
    <>
      <path d="M86 94 V34 H132 V94 M188 94 V34 H234 V94" className="vp-line strong" />
      <path d="M132 48 C152 36 168 36 188 48" className="vp-free" />
      <path d="M92 96 C126 72 178 120 236 72" className="vp-thread" />
      <circle cx="92" cy="96" r="5" className="vp-dot" />
      <circle cx="236" cy="72" r="5" className="vp-dot" />
    </>
  );
}

function MiniCases() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={68 + i * 12} y={28 + i * 10} width="112" height="54" rx="4" className="vp-panel" />
      ))}
      <path d="M200 38 h54 M200 56 h42 M200 74 h62" className="vp-line" />
      <path d="M206 92 h54" className="vp-fenced" />
      <circle cx="88" cy="54" r="7" className="vp-dot alt" />
      <circle cx="112" cy="72" r="7" className="vp-dot ember" />
    </>
  );
}

function MiniGiants() {
  return (
    <>
      <line x1="30" y1="98" x2="290" y2="98" className="vp-line" />
      {[52, 92, 132, 172, 212, 252].map((x, i) => {
        const h = [52, 64, 46, 70, 56, 62][i];
        return (
          <rect
            key={x}
            x={x - 9}
            y={98 - h}
            width="18"
            height={h}
            rx="2"
            className={i % 2 ? "vp-fill alt" : "vp-fill"}
          />
        );
      })}
      <path d="M167 30 l8 14 -11 12 9 15" className="vp-thread" />
      <path d="M87 36 l7 12 -9 11" className="vp-thread" />
    </>
  );
}

const RENDERERS: Record<WorldPreviewKind, () => ReactNode> = {
  canon: MiniCanon,
  search: MiniSearch,
  topics: MiniTopics,
  words: MiniWords,
  thread: MiniThread,
  inkstone: MiniInkStone,
  map: MiniMap,
  gallery: MiniGallery,
  timeline: MiniTimeline,
  route: MiniRoute,
  books: MiniBooks,
  era: MiniEra,
  tree: MiniTree,
  council: MiniCouncil,
  faces: MiniFaces,
  giants: MiniGiants,
  ladder: MiniLadder,
  fall: MiniFall,
  encounters: MiniEncounters,
  demons: MiniDemons,
  fence: MiniFence,
  free: MiniFree,
  cases: MiniCases,
};

export default function WorldPreview({ kind }: { kind: WorldPreviewKind }) {
  const Render = RENDERERS[kind];
  return (
    <span className={`scr-card-visual scr-card-visual-${kind}`} aria-hidden="true">
      <svg viewBox="0 0 320 120" focusable="false">
        <Render />
      </svg>
    </span>
  );
}
