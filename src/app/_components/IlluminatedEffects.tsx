"use client";

import { useEffect, useRef } from "react";

/**
 * The light in the room. Two things on every page read it:
 *
 * - Gold leaf (initials, the cross marks) takes its highlight from where the
 *   pointer is — or, on a phone that reports orientation without a permission
 *   prompt, from the tilt of the hand. core.css reads `--lx`/`--ly` (0..1).
 * - The lamp: in lamplight a warm pool follows the hand and the vellum fibre
 *   shows inside it (`.lamp`, shown only in the dark theme and never under
 *   high contrast or reduced motion). It reads `--px`/`--py` in pixels.
 *
 * Nothing here runs a frame loop: values change only when the pointer does.
 */
export default function IlluminatedEffects() {
  const lampRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const lamp = lampRef.current;
    let frame = 0;
    let x = window.innerWidth * 0.35;
    let y = window.innerHeight * 0.3;

    const paint = () => {
      frame = 0;
      root.style.setProperty("--lx", Math.min(1, Math.max(0, x / window.innerWidth)).toFixed(3));
      root.style.setProperty("--ly", Math.min(1, Math.max(0, y / window.innerHeight)).toFixed(3));
      if (lamp) {
        lamp.style.setProperty("--px", `${Math.round(x)}px`);
        lamp.style.setProperty("--py", `${Math.round(y)}px`);
      }
    };
    const setLight = (nx: number, ny: number) => {
      x = nx;
      y = ny;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onPointer = (event: PointerEvent) => setLight(event.clientX, event.clientY);
    const onTilt = (event: DeviceOrientationEvent) => {
      if (event.gamma == null || event.beta == null) return;
      setLight((0.5 + event.gamma / 60) * window.innerWidth, (0.5 + (event.beta - 40) / 70) * window.innerHeight);
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    // iOS gates orientation behind a permission prompt that needs a gesture;
    // Android and desktop report it freely. Only listen where no prompt exists.
    const orientation = (window as Window & {
      DeviceOrientationEvent?: { requestPermission?: unknown };
    }).DeviceOrientationEvent;
    const canTilt =
      !!orientation &&
      typeof orientation.requestPermission !== "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    if (canTilt) window.addEventListener("deviceorientation", onTilt);
    paint();

    return () => {
      window.removeEventListener("pointermove", onPointer);
      if (canTilt) window.removeEventListener("deviceorientation", onTilt);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={lampRef} className="lamp" aria-hidden="true" />;
}
