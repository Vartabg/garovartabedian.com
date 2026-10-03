"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  centerWorldInTrack,
  claimWorldSwitcherCoachmark,
} from "@/lib/world-switcher";
import { WORLD_REGISTRY } from "@/lib/world-registry";

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

const WORLDS_NAV = [
  { href: "/", label: "Home", hint: "the front door", tone: "#8a5a13", toneInk: "#fdf9ee" },
  ...WORLD_REGISTRY.map((world) => ({
    href: world.href,
    label: world.label,
    hint: world.hint,
    tone: world.accent,
    toneInk: world.toneInk,
  })),
];

function matchesWorld(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function prefersReducedData(): boolean {
  if (typeof navigator === "undefined") return false;
  return !!(navigator as NavigatorWithConnection).connection?.saveData;
}

/**
 * The dock, reborn: the theme switcher's shell now steps between worlds.
 * Same pill, same feedback caption, same page-session coachmark — but each
 * chip is a doorway, and choosing one carries you there (View Transition when
 * the browser supports it, plain navigation when it doesn't).
 */
export default function WorldSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [coach, setCoach] = useState(false);

  const isCurrent = (href: string) => pathname === href;
  const isInWorld = (href: string) => matchesWorld(pathname, href);
  const canShowCoach = WORLDS_NAV.some((w) => pathname === w.href);
  const activeIndex = WORLDS_NAV.findIndex((w) => isInWorld(w.href));

  useEffect(() => {
    const active = refs.current[activeIndex];
    const track = trackRef.current;
    if (activeIndex < 0 || !active || !track) return;

    centerWorldInTrack(track, active);
  }, [activeIndex]);

  useEffect(() => {
    if (!canShowCoach) {
      setCoach(false);
      return;
    }
    if (claimWorldSwitcherCoachmark(document)) setCoach(true);
  }, [canShowCoach]);

  useEffect(() => {
    if (!coach) return;
    const t = window.setTimeout(() => {
      setCoach(false);
    }, 5200);
    return () => window.clearTimeout(t);
  }, [coach]);

  const dismissCoach = () => {
    setCoach(false);
  };

  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // let the browser do its thing
    if (coach) dismissCoach();
    if (isCurrent(href)) {
      e.preventDefault();
      return;
    }
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => void;
    };
    // Snapshotting needs a rendering tab; anywhere it can't run, plain navigation.
    if (
      doc.startViewTransition &&
      document.visibilityState === "visible" &&
      !prefersReducedMotion() &&
      !prefersReducedData()
    ) {
      e.preventDefault();
      doc.startViewTransition(() => {
        router.push(href);
      });
    }
    // otherwise let the Link navigate normally
  };

  const focusWorld = (index: number) => {
    const next = (index + WORLDS_NAV.length) % WORLDS_NAV.length;
    refs.current[next]?.focus();
    setPreview(WORLDS_NAV[next].href);
  };

  const onKey = (e: React.KeyboardEvent<HTMLAnchorElement>, index: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      focusWorld(index + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      focusWorld(index - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusWorld(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusWorld(WORLDS_NAV.length - 1);
    }
  };

  const shown =
    WORLDS_NAV.find((w) => w.href === preview) ??
    WORLDS_NAV.find((w) => isInWorld(w.href)) ??
    WORLDS_NAV[0];

  return (
    <nav
      className="vsw"
      aria-label="Step between the worlds of this site"
      data-mounted="true"
      data-world-switcher="true"
      data-coach={coach && canShowCoach ? "true" : undefined}
    >
      {coach && canShowCoach && (
        <div className="vsw-coach" role="note">
          <span>One site, many worlds — step through.</span>
          <button type="button" className="vsw-coach-x" onClick={dismissCoach} aria-label="Dismiss hint">
            ✕
          </button>
        </div>
      )}

      <span className="vsw-label" aria-hidden="true">
        <span className="vsw-swatch">
          <i />
          <i />
          <i />
        </span>
        Worlds
      </span>

      <div ref={trackRef} className="vsw-track" onMouseLeave={() => setPreview(null)}>
        {WORLDS_NAV.map((w, index) => (
          <span key={w.href} className="vsw-cell">
            <Link
              ref={(el) => {
                refs.current[index] = el;
              }}
              href={w.href}
              className={`vsw-opt${isInWorld(w.href) ? " is-active" : ""}`}
              aria-current={isCurrent(w.href) ? "page" : isInWorld(w.href) ? "location" : undefined}
              aria-label={`${w.label}: ${w.hint}`}
              style={
                {
                  "--world-tone": w.tone,
                  "--world-tone-ink": w.toneInk,
                } as CSSProperties
              }
              onClick={(e) => go(e, w.href)}
              onKeyDown={(e) => onKey(e, index)}
              onMouseEnter={() => setPreview(w.href)}
              onFocus={() => setPreview(w.href)}
              onBlur={() => setPreview(null)}
            >
              <span className="vsw-world-mark" aria-hidden="true" />
              {w.label}
            </Link>
          </span>
        ))}
      </div>

      <span className="vsw-hint" aria-hidden="true">{shown.hint}</span>
    </nav>
  );
}
