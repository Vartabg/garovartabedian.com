import Image from "next/image";
import type { JesusEssay } from "@/lib/jesus/types";

const ESSAY_IMAGES: Record<string, { src: string; alt: string; kicker: string }> = {
  grand: {
    src: "/jesus/history/convergence-hero.png",
    alt: "Three visual streams of archaeology, culture, and geometry converging toward an empty tomb with cross-shaped light.",
    kicker: "Synthesis Pillar I · Epistemological Convergence",
  },
  historical: {
    src: "/jesus/history/history-archaeology.png",
    alt: "Archaeology excavation table with stone fragments, parchment, brushes, Roman nails, and manuscript materials.",
    kicker: "Synthesis Pillar II · Epigraphy & Excavation",
  },
  global: {
    src: "/jesus/history/global-context.png",
    alt: "A circle of hands sharing bread, coconut, olive branches, and woven textiles around cross-shaped light.",
    kicker: "Synthesis Pillar III · Global Contextual Christology",
  },
  scientific: {
    src: "/jesus/history/science-logos.png",
    alt: "Luminous topological rings, particles, waves, and information geometry converging on a focal cross point.",
    kicker: "Synthesis Pillar IV · Information & Cosmos Models",
  },
};

function formatInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="jsu-essay-inline-code">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function renderMarkdownBlocks(markdown: string) {
  const lines = markdown.split("\n");
  const elements: React.ReactNode[] = [];
  let blockIndex = 0;
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${blockIndex++}`} className="jsu-essay-pre">
            <code>{codeBuffer.join("\n")}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    const trimmed = line.trim();

    if (!trimmed) continue;

    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={`h1-${blockIndex++}`} className="jsu-essay-h1">
          {formatInline(trimmed.slice(2))}
        </h2>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={`h2-${blockIndex++}`} className="jsu-essay-h2">
          {formatInline(trimmed.slice(3))}
        </h3>
      );
    } else if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={`h3-${blockIndex++}`} className="jsu-essay-h3">
          {formatInline(trimmed.slice(4))}
        </h4>
      );
    } else if (trimmed === "---") {
      elements.push(<hr key={`hr-${blockIndex++}`} className="jsu-essay-hr" />);
    } else if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote key={`quote-${blockIndex++}`} className="jsu-essay-quote">
          <p>{formatInline(trimmed.slice(2))}</p>
        </blockquote>
      );
    } else if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      elements.push(
        <li key={`li-${blockIndex++}`} className="jsu-essay-li">
          {formatInline(trimmed.slice(2))}
        </li>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const text = trimmed.replace(/^\d+\.\s/, "");
      elements.push(
        <li key={`oli-${blockIndex++}`} className="jsu-essay-li">
          {formatInline(text)}
        </li>
      );
    } else {
      elements.push(
        <p key={`p-${blockIndex++}`} className="jsu-essay-p">
          {formatInline(trimmed)}
        </p>
      );
    }
  }

  return elements;
}

export default function SynthesisEssays({ essays }: { essays: JesusEssay[] }) {
  if (!essays || essays.length === 0) return null;

  return (
    <section className="jsu-history-shelf" id="synthesis-essays">
      <h2 className="jsu-lane">Synthesis Essays</h2>
      <p className="scr-meta">
        Deep investigations connecting historical soil, archaeological stone, global contextual theology, and physical-mathematical models of reality.
      </p>

      <div className="jsu-essays-grid">
        {essays.map((essay) => {
          const meta = ESSAY_IMAGES[essay.id] || {
            src: "/jesus/history/convergence-hero.png",
            alt: essay.title,
            kicker: "Synthesis Essay",
          };

          return (
            <article key={essay.id} className="jsu-essay-card">
              <div className="jsu-essay-media">
                <Image
                  src={meta.src}
                  alt={meta.alt}
                  width={600}
                  height={320}
                  className="jsu-essay-img"
                />
                <span className="jsu-essay-kicker">{meta.kicker}</span>
              </div>

              <div className="jsu-essay-header">
                <h3>{essay.title}</h3>
                <p className="jsu-essay-summary">{essay.summary}</p>
              </div>

              <details className="jsu-essay-details">
                <summary className="jsu-essay-summary-btn">
                  <span>Read full essay</span>
                </summary>
                <div className="jsu-essay-content">
                  {renderMarkdownBlocks(essay.body)}
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
