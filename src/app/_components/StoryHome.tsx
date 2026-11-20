import Link from "next/link";
import Image from "next/image";
import { HOME, PROFILE } from "@/lib/portfolio-content";
import { hostedWebVerse } from "@/lib/scriptures/hosted-verse";
import Reveal from "./Reveal";
import SiteNavigation from "./SiteNavigation";
import WorldsRail from "./sections/WorldsRail";
import { ButtonLink } from "./Button";
import SunlitLeaf from "./SunlitLeaf";
import DiscoveryDesk from "./DiscoveryDesk";
import StoryStrip from "./StoryStrip";
import SiteFooterLinks from "./SiteFooterLinks";
import XrayTag from "./xray/XrayTag";
import { homeXrayTag } from "@/lib/site/world-xray";

/**
 * The site's front door: Jesus first, Scripture immediately usable, and the
 * remaining worlds as one ordered walk. Personal context stays available
 * without making the author the masthead.
 */
export default function StoryHome() {
  return (
    <Reveal>
      {/* The top of the page is a leaf lit by the sun over Jerusalem right
          now (Garo picked "Tabernacle Light", 2026-10-16). */}
      <SunlitLeaf lead={HOME.skyLead} nightLead={HOME.skyNightLead} dayLead={HOME.skyDayLead} />
      <header className="st-nav" style={{ viewTransitionName: "st-nav" }}>
        {/* The same cross WorldHeader carries. 4754d98 swapped it here for a
            G-V lettermark whose cross was ~5px tall at render size — it read as
            a lightbulb, and it made the author the masthead of a site that is
            not about him. */}
        <Link href="/" className="st-home-mark" aria-label="Home — Garo Vartabedian" style={{ viewTransitionName: "home-mark" }}>
          <span className="st-cross-mark" aria-hidden="true" />
        </Link>
        <SiteNavigation activeHref="/" className="st-nav-links" />
      </header>

      <main id="main">
        {/* Garo's call, 2026-10-03: this is also a portfolio project, and an
            engineer should be able to tell from the first screen. One plain
            line in the band above the rule; the case study carries the rest. */}
        <p className="st-builder">
          <span>{`${HOME.builderLead} ${PROFILE.name}`}</span>
          <span className="st-builder-sep" aria-hidden="true">
            ·
          </span>
          <Link href={HOME.builderHref}>
            {HOME.builderLinkLabel}
            <span aria-hidden="true">→</span>
          </Link>
        </p>
        <XrayTag {...homeXrayTag()} />

        <section className="st-frontispiece" aria-labelledby="home-purpose" style={{ viewTransitionName: "frontispiece" }}>
          {/* The plate is 1536x1024 — the largest that exists — so a wide
              retina viewport already upscales it. The site-wide q70 re-encode
              stacked a second generation of loss on top of that; 85 keeps the
              detail the source still has. */}
          <div className="st-front" style={{ viewTransitionName: "front" }}>
            <p className="st-label">{HOME.worldsLabel}</p>
            <h1 className="st-front-title" id="home-purpose">
              {HOME.worldsHeading}
            </h1>
            <p className="st-front-text">{hostedWebVerse("MAT", 28, 6)}</p>
            <p className="st-front-cite">
              <Link href="/scriptures/protestant/MAT/28#v6">Matthew 28:6</Link>
              <span> · World English Bible</span>
            </p>
            <div className="st-front-actions">
              <ButtonLink
                href={HOME.primaryHref}
                variant="primary"
                className="st-intro-primary"
              >
                {HOME.primaryLabel}
              </ButtonLink>
              <ButtonLink
                href={HOME.scriptureHref}
                variant="ghost"
                className="st-intro-secondary"
              >
                {HOME.scriptureLabel}
              </ButtonLink>
            </div>
            {/* Garo's pick, 2026-11-10: the story pictures take the place of
                the two scroll links, so the first screen shows a way in that
                needs no reading. */}
            <StoryStrip />
            {/* Filled in by SunlitLeaf with the time and the sun's place;
                hidden unless the light is actually drawn. */}
            <p className="st-sky" data-sky-readout>
              {`${HOME.skyLead}.`}
            </p>
          </div>
          {/* The same photograph the front door always carried, set as a
              plate: one frame, one tone, a caption that says what it is. The
              caption carries the description, so the image is presentational. */}
          <figure className="st-frontispiece-plate plate">
            <span className="plate-frame">
              <Image
                src="/home/empty-tomb-dawn.jpg"
                alt=""
                fill
                priority
                quality={85}
                sizes="(min-width: 900px) 34rem, 100vw"
              />
            </span>
            <figcaption>
              An empty first-century rock-cut tomb at dawn, its round sealing stone rolled aside.
            </figcaption>
          </figure>
        </section>

        <DiscoveryDesk />
        <WorldsRail />
      </main>

      <footer className="st-foot">
        <div>
          <span className="st-foot-cross" aria-hidden="true">
            <span className="st-cross-mark" />
          </span>
          <p>{HOME.webNote}</p>
        </div>
        <SiteFooterLinks />
        <p className="st-foot-author">
          Created and maintained by {PROFILE.name} · {PROFILE.location}
        </p>
      </footer>
    </Reveal>
  );
}
