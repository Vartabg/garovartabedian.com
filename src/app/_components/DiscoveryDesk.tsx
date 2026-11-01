import Link from "next/link";
import { DISCOVERY, RESEARCH_TOOLS } from "@/lib/portfolio-content";

export default function DiscoveryDesk() {
  const bridge = RESEARCH_TOOLS.find(tool => tool.id === "word-bridge")!;
  return (
    <section className="discovery-desk" aria-labelledby="discovery-heading" id="discover">
      <header className="discovery-desk-head">
        <div>
          <p className="discovery-eyebrow">THE LIVING CODEX</p>
          <h2 id="discovery-heading">{DISCOVERY.heading}</h2>
        </div>
        <p className="lens-reader-copy">{DISCOVERY.intro}</p>
        <p className="lens-engineer-copy">{DISCOVERY.engineeringIntro}</p>
      </header>
      <Link href={bridge.href} className="discovery-bridge-tool">
        <strong>{bridge.label}</strong>
        <span className="lens-reader-copy">{bridge.description}</span>
        <span className="lens-engineer-copy">{bridge.engineering}</span>
        <span>Open Word Bridge <span aria-hidden="true">→</span></span>
      </Link>
      <div className="discovery-tools">
        {RESEARCH_TOOLS.slice(0, 4).map((tool) => (
          <Link className={`discovery-tool discovery-tool--${tool.id}`} href={tool.href} key={tool.id}>
            <span className="discovery-tool-top"><span>{tool.category}</span><span aria-hidden="true">↗</span></span>
            <span className="discovery-tool-mark" aria-hidden="true">{tool.mark}</span>
            <h3>{tool.title}</h3>
            <p className="lens-reader-copy">{tool.description}</p>
            <p className="lens-engineer-copy">{tool.engineering}</p>
            <span className="discovery-tool-action">{tool.label}<span aria-hidden="true"> →</span></span>
          </Link>
        ))}
      </div>
      <p className="discovery-bridge">{DISCOVERY.bridge} <Link href="/work/garovartabedian">{DISCOVERY.sourceLabel} →</Link></p>
    </section>
  );
}
