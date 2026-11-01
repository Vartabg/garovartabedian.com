"use client";

import { useEffect, useRef } from "react";
import {
  JERUSALEM,
  compassPoint,
  leafBrightness,
  lightDirection,
  nightness,
  skyLight,
  sunPosition,
} from "@/lib/sun";

/**
 * The front door is a leaf of vellum lit by the sun over Jerusalem right now.
 *
 * WebGL2, two passes: the skin's relief is baked once per size, then each
 * frame only relights it, so a frame costs one texture read per pixel. The
 * headline stays real text — selectable, read once by screen readers — and is
 * made transparent only after the canvas has painted its gold-leaf copy from
 * the same glyph positions. Without WebGL, under forced colors, or before the
 * first frame, the page is the ordinary front door.
 *
 * An explicit light or dark choice in the reading menu wins over the sky: the
 * light keeps its direction but stays a day leaf or a night leaf.
 */

type Props = {
  /** The readout's opening words, e.g. "Lit by the sun over Jerusalem". */
  lead: string;
  /** Opening words when a dark theme choice holds the leaf at night. */
  nightLead: string;
  /** Opening words when a light theme choice holds the leaf in daylight. */
  dayLead: string;
};

const VS = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const NOISE = `
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}`;

// Pass 1, once per size: the skin's cockles and fibres, baked as normals.
const FS_SKIN = `#version 300 es
precision highp float;
uniform float uDpr;
out vec4 o;
${NOISE}
float h(vec2 p) { return fbm(p * 0.0042) * 1.5 + fbm(vec2(p.x * 0.05, p.y * 0.013)) * 0.32 + noise(p * 0.7) * 0.07; }
void main() {
  vec2 p = gl_FragCoord.xy / uDpr;
  float h0 = h(p), hx = h(p + vec2(1.0, 0.0)), hy = h(p + vec2(0.0, 1.0));
  vec3 n = normalize(vec3((h0 - hx) * 3.2, (h0 - hy) * 3.2, 1.0));
  o = vec4(n.xy * 0.5 + 0.5, 0.9 + 0.1 * fbm(p * 0.012), smoothstep(0.56, 0.82, fbm(p * 0.0024 + 7.0)));
}`;

// Bevel, once per layout: the letters' coverage blurred at full resolution
// (13-tap Gaussian, run across then down). Its slope is the gold's bevel.
// Reading the slope from mipmaps instead made stair-stepped highlights.
const FS_BLUR = `#version 300 es
precision highp float;
uniform sampler2D uSrc;
uniform vec2 uRes, uStep;
uniform float uFromMask;
out vec4 o;
const float W[7] = float[7](0.1610, 0.1486, 0.1169, 0.0784, 0.0448, 0.0217, 0.0090);
float at(vec2 uv) {
  vec4 t = texture(uSrc, uv);
  return uFromMask > 0.5 ? t.a : t.r;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float s = at(uv) * W[0];
  for (int i = 1; i < 7; i++) s += (at(uv + uStep * float(i)) + at(uv - uStep * float(i))) * W[i];
  o = vec4(s, s, s, 1.0);
}`;

// Pass 2, per frame: light the skin and the gold leaf.
const FS_LIGHT = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uDpr, uK, uNight;
uniform vec3 uL, uCol, uAmb, uLamp;
uniform sampler2D uSkin, uMask, uBevel;
out vec4 o;
${NOISE}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes, px = gl_FragCoord.xy / uDpr;
  vec4 sk = texture(uSkin, uv);
  vec2 nxy = sk.xy * 2.0 - 1.0;
  vec3 n = vec3(nxy, sqrt(max(0.0, 1.0 - dot(nxy, nxy))));
  vec3 L = normalize(uL);
  vec3 alb = vec3(0.925, 0.894, 0.816) * sk.z * (1.0 - 0.07 * sk.w) - vec3(0.0, 0.01, 0.03) * sk.w;
  vec3 lampCol = vec3(1.0, 0.70, 0.40);
  vec3 ld = normalize(vec3(uLamp.xy, 180.0) - vec3(px, 0.0));
  float dist = length(uLamp.xy - px);
  float lampK = uLamp.z / (1.0 + dist * dist / 90000.0);
  // Letters cast their shadow away from the sun.
  vec2 toward = L.xy / max(L.z, 0.14) * 5.0;
  toward /= max(1.0, length(toward) / 22.0);
  float shadow = texture(uBevel, uv + toward * uDpr / uRes).r;
  vec3 direct = uCol * uK * max(dot(n, L), 0.0) * (1.0 - 0.55 * shadow);
  vec3 skin = alb * (uAmb + direct + lampCol * lampK * max(dot(n, ld), 0.0)) / 1.15;
  // Gold leaf: beveled letters, dark until they catch the light.
  // Coverage comes from alpha: the canvas stores antialiased edges there.
  float m = texture(uMask, uv).a;
  vec2 e = vec2(1.5) / uRes;
  float bx = texture(uBevel, uv + vec2(e.x, 0.0)).r - texture(uBevel, uv - vec2(e.x, 0.0)).r;
  float by = texture(uBevel, uv + vec2(0.0, e.y)).r - texture(uBevel, uv - vec2(0.0, e.y)).r;
  vec2 cr = vec2(noise(px * 0.16) - noise(px * 0.16 + 5.1), noise(px * 0.16 + 9.7) - noise(px * 0.16 + 3.3));
  vec3 gn = normalize(vec3(-bx * 2.4 * uDpr + cr.x * 0.06, -by * 2.4 * uDpr + cr.y * 0.06, 1.0));
  vec3 V = vec3(0.0, 0.0, 1.0);
  // A broad sheen with a small glint on top, instead of one hard band.
  float ndh = max(dot(gn, normalize(L + V)), 0.0);
  float spec = pow(ndh, 18.0) * 0.75 + pow(ndh, 70.0) * 0.45;
  float ndl = max(dot(gn, normalize(ld + V)), 0.0);
  float specL = (pow(ndl, 14.0) * 0.75 + pow(ndl, 50.0) * 0.4) * lampK;
  vec3 gDark = vec3(0.34, 0.235, 0.07), gMid = vec3(0.70, 0.50, 0.17), gHi = vec3(1.0, 0.86, 0.52);
  vec3 gold = gDark * (0.55 + uAmb * 0.9) + gMid * (0.30 * uNight + 0.12)
    + gMid * uCol * uK * max(dot(gn, L), 0.0) * 0.45
    + gHi * (uCol * uK * spec * 1.7 + lampCol * specL * 1.9) + gMid * lampCol * lampK * 0.55;
  float rim = clamp(texture(uBevel, uv).r * 2.2, 0.0, 1.0) * (1.0 - m);
  skin = mix(skin, skin * 0.55, rim * 0.6);
  o = vec4(pow(mix(skin, gold, m), vec3(0.97)), 1.0);
}`;

function motionReduced() {
  return (
    document.documentElement.dataset.a11yMotion === "reduce" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function SunlitLeaf({ lead, nightLead, dayLead }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // The canvas sits behind the header, the builder line, and the
    // frontispiece; it ends where the frontispiece does.
    const canvas = canvasRef.current;
    const leaf = canvas?.parentElement;
    const title = leaf?.querySelector<HTMLElement>("#home-purpose");
    const area = leaf?.querySelector<HTMLElement>(".st-frontispiece");
    const readout = leaf?.querySelector<HTMLElement>("[data-sky-readout]");
    if (!canvas || !leaf || !title || !area) return;
    if (window.matchMedia("(forced-colors: active)").matches) return;

    const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: false });
    if (!gl) return;

    const compile = (fs: string) => {
      const program = gl.createProgram();
      for (const [type, src] of [
        [gl.VERTEX_SHADER, VS],
        [gl.FRAGMENT_SHADER, fs],
      ] as const) {
        const shader = gl.createShader(type);
        if (!shader) throw new Error("shader");
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "shader");
        gl.attachShader(program, shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "link");
      return program;
    };
    let skinProgram: WebGLProgram;
    let lightProgram: WebGLProgram;
    let blurProgram: WebGLProgram;
    try {
      skinProgram = compile(FS_SKIN);
      lightProgram = compile(FS_LIGHT);
      blurProgram = compile(FS_BLUR);
    } catch {
      return;
    }

    const vao = gl.createVertexArray();
    const skinTex = gl.createTexture();
    const maskTex = gl.createTexture();
    const fbo = gl.createFramebuffer();
    // The bevel: [across, then down]. Half-float keeps the blurred slope
    // smooth; 8-bit is the fallback where float targets are unavailable.
    const bevelTex = [gl.createTexture(), gl.createTexture()];
    const halfFloat = Boolean(gl.getExtension("EXT_color_buffer_float"));
    const maskCanvas = document.createElement("canvas");
    const mask = maskCanvas.getContext("2d");
    if (!mask) return;
    const u = (program: WebGLProgram, name: string) => gl.getUniformLocation(program, name);
    const clock = new Intl.DateTimeFormat("en-GB", {
      timeZone: JERUSALEM.timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });

    // `?sky=HH:MM` shows the leaf at that Jerusalem time today (for previews
    // and tests); the caption then reports that time instead of now.
    const forced = /^(\d{1,2}):(\d{2})$/.exec(new URLSearchParams(window.location.search).get("sky") ?? "");
    const at = () => {
      if (!forced) return new Date();
      const now = new Date();
      const local = (zone: string) => new Date(now.toLocaleString("en-US", { timeZone: zone })).getTime();
      const offset = local(JERUSALEM.timeZone) - local("UTC");
      const day = new Date(now.getTime() + offset);
      return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), Number(forced[1]), Number(forced[2])) - offset);
    };

    let width = 0;
    let height = 0;
    let dpr = 1;
    let lit = false;
    let frame = 0;
    let disposed = false;
    // The lamp rests on the headline; the pointer moves it and tilts the light.
    const rest = { x: 0.3, y: 0.3 };
    const pointer = { x: 0, y: 0, on: 0, px: 0.3, py: 0.3 };
    const target = { x: 0, y: 0, on: 0, px: 0.3, py: 0.3 };
    let sky = sample();

    function sample() {
      const sun = sunPosition(at());
      const choice = document.documentElement.dataset.a11yTheme;
      const elevation =
        choice === "dark" ? Math.min(sun.elevation, -12) : choice === "light" ? Math.max(sun.elevation, 4) : sun.elevation;
      return {
        sun,
        elevation,
        held: elevation === sun.elevation ? null : choice === "dark" ? "night" : "day",
        light: skyLight(elevation),
        direction: lightDirection({ elevation, azimuth: sun.azimuth }),
        night: nightness(elevation),
        dark: leafBrightness(elevation) < 0.3,
      };
    }

    function describe() {
      leaf!.dataset.sky = sky.dark ? "dark" : "light";
      const { light, direction } = sky;
      const tint = light.color.map((c, i) =>
        Math.round(255 * Math.min(1, 0.32 + (0.68 * (light.ambient[i] + c * light.strength * Math.max(direction[2], 0.15))) / 1.15)),
      );
      leaf!.style.setProperty("--sky-tint", `rgb(${tint.join(" ")})`);
      if (readout) {
        const degrees = Math.round(Math.abs(sky.sun.elevation));
        const where = sky.sun.elevation >= 0 ? "above" : "below";
        const opening = sky.held === "night" ? nightLead : sky.held === "day" ? dayLead : lead;
        readout.textContent = `${opening} · ${clock.format(at())} · the sun is ${degrees}° ${where} the horizon, ${compassPoint(sky.sun.azimuth)}`;
      }
    }

    function buildMask() {
      maskCanvas.width = width;
      maskCanvas.height = height;
      mask!.clearRect(0, 0, width, height);
      const style = getComputedStyle(title!);
      const size = parseFloat(style.fontSize) * dpr;
      mask!.font = `${style.fontWeight} ${size}px ${style.fontFamily}`;
      mask!.fillStyle = "#fff";
      mask!.textBaseline = "alphabetic";
      const ascent = mask!.measureText("Jesus").fontBoundingBoxAscent || size * 0.9;
      const box = canvas!.getBoundingClientRect();
      const range = document.createRange();
      const walker = document.createTreeWalker(title!, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
        for (let i = 0; i < node.length; i++) {
          const ch = node.data[i];
          if (ch.trim() === "") continue;
          range.setStart(node, i);
          range.setEnd(node, i + 1);
          const r = range.getBoundingClientRect();
          if (!r.width) continue;
          mask!.fillText(ch, (r.left - box.left) * dpr, (r.top - box.top) * dpr + ascent);
        }
      }
      gl!.bindTexture(gl!.TEXTURE_2D, maskTex);
      gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, true);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, maskCanvas);
      gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, false);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR_MIPMAP_LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      gl!.generateMipmap(gl!.TEXTURE_2D);
    }

    function bakeBevel() {
      const step = Math.max(1, dpr * 0.75);
      for (const tex of bevelTex) {
        gl!.bindTexture(gl!.TEXTURE_2D, tex);
        if (halfFloat) gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.R16F, width, height, 0, gl!.RED, gl!.HALF_FLOAT, null);
        else gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA8, width, height, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, null);
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      }
      gl!.useProgram(blurProgram);
      gl!.viewport(0, 0, width, height);
      gl!.bindVertexArray(vao);
      gl!.uniform2f(u(blurProgram, "uRes"), width, height);
      gl!.uniform1i(u(blurProgram, "uSrc"), 0);
      gl!.activeTexture(gl!.TEXTURE0);
      const passes = [
        { src: maskTex, dst: bevelTex[0], step: [step / width, 0], fromMask: 1 },
        { src: bevelTex[0], dst: bevelTex[1], step: [0, step / height], fromMask: 0 },
      ] as const;
      for (const pass of passes) {
        gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
        gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, pass.dst, 0);
        gl!.bindTexture(gl!.TEXTURE_2D, pass.src);
        gl!.uniform2f(u(blurProgram, "uStep"), pass.step[0], pass.step[1]);
        gl!.uniform1f(u(blurProgram, "uFromMask"), pass.fromMask);
        gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      }
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    }

    function bakeSkin() {
      gl!.bindTexture(gl!.TEXTURE_2D, skinTex);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA8, width, height, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, null);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.NEAREST);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.NEAREST);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, skinTex, 0);
      gl!.viewport(0, 0, width, height);
      gl!.useProgram(skinProgram);
      gl!.uniform1f(u(skinProgram, "uDpr"), dpr);
      gl!.bindVertexArray(vao);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    }

    function draw() {
      const [lx, ly, lz] = sky.direction;
      gl!.viewport(0, 0, width, height);
      gl!.useProgram(lightProgram);
      gl!.uniform2f(u(lightProgram, "uRes"), width, height);
      gl!.uniform1f(u(lightProgram, "uDpr"), dpr);
      gl!.uniform3f(u(lightProgram, "uL"), lx + pointer.x * 0.55 * pointer.on, ly + pointer.y * 0.55 * pointer.on, lz);
      gl!.uniform3f(u(lightProgram, "uCol"), ...sky.light.color);
      gl!.uniform3f(u(lightProgram, "uAmb"), ...sky.light.ambient);
      gl!.uniform1f(u(lightProgram, "uK"), sky.light.strength);
      gl!.uniform1f(u(lightProgram, "uNight"), sky.night);
      gl!.uniform3f(
        u(lightProgram, "uLamp"),
        (pointer.px * width) / dpr,
        ((1 - pointer.py) * height) / dpr,
        sky.night * (0.55 + 0.6 * pointer.on),
      );
      gl!.activeTexture(gl!.TEXTURE0);
      gl!.bindTexture(gl!.TEXTURE_2D, skinTex);
      gl!.uniform1i(u(lightProgram, "uSkin"), 0);
      gl!.activeTexture(gl!.TEXTURE1);
      gl!.bindTexture(gl!.TEXTURE_2D, maskTex);
      gl!.uniform1i(u(lightProgram, "uMask"), 1);
      gl!.activeTexture(gl!.TEXTURE2);
      gl!.bindTexture(gl!.TEXTURE_2D, bevelTex[1]);
      gl!.uniform1i(u(lightProgram, "uBevel"), 2);
      gl!.bindVertexArray(vao);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      if (!lit) {
        lit = true;
        leaf!.classList.add("is-lit");
      }
    }

    function layout() {
      if (disposed) return;
      const top = leaf!.getBoundingClientRect().top;
      const skyHeight = `${Math.round(area!.getBoundingClientRect().bottom - top)}px`;
      canvas!.style.height = skyHeight;
      leaf!.style.setProperty("--sky-h", skyHeight);
      const box = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.round(box.width * dpr));
      height = Math.max(1, Math.round(box.height * dpr));
      canvas!.width = width;
      canvas!.height = height;
      const t = title!.getBoundingClientRect();
      rest.x = (t.left + t.width * 0.45 - box.left) / box.width;
      rest.y = (t.top - t.height * 0.2 - box.top) / box.height;
      if (!target.on) {
        pointer.px = target.px = rest.x;
        pointer.py = target.py = rest.y;
      }
      bakeSkin();
      buildMask();
      bakeBevel();
      draw();
    }

    function tick() {
      frame = 0;
      const k = motionReduced() ? 1 : 0.14;
      let moving = 0;
      for (const key of ["x", "y", "on", "px", "py"] as const) {
        pointer[key] += (target[key] - pointer[key]) * k;
        moving += Math.abs(target[key] - pointer[key]);
      }
      draw();
      if (moving > 0.002) frame = requestAnimationFrame(tick);
    }
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      if (!target.on) return;
      Object.assign(target, { px: rest.x, py: rest.y, on: 0 });
      kick();
    };
    const onPointer = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const fx = (event.clientX - box.left) / box.width;
      const fy = (event.clientY - box.top) / box.height;
      if (fy > 1) return onLeave();
      Object.assign(target, { px: fx, py: fy, x: (fx - 0.5) * 2, y: -(fy - 0.5) * 2, on: 1 });
      kick();
    };
    const refresh = () => {
      sky = sample();
      describe();
      if (width) draw();
    };
    const relayout = () => requestAnimationFrame(layout);

    leaf.addEventListener("pointermove", onPointer);
    leaf.addEventListener("pointerdown", onPointer);
    leaf.addEventListener("pointerleave", onLeave);
    const resize = new ResizeObserver(relayout);
    resize.observe(leaf);
    resize.observe(area);
    resize.observe(title);
    // The reading menu changes theme, font, and spacing on <html>.
    const settings = new MutationObserver(() => {
      refresh();
      relayout();
    });
    settings.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-a11y-theme", "data-a11y-font", "data-a11y-spacing", "data-a11y-motion"],
    });
    const minute = window.setInterval(refresh, 60_000);
    const lost = (event: Event) => {
      event.preventDefault();
      leaf.classList.remove("is-lit");
      delete leaf.dataset.sky;
    };
    canvas.addEventListener("webglcontextlost", lost);

    describe();
    void document.fonts.ready.then(relayout);

    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      window.clearInterval(minute);
      resize.disconnect();
      settings.disconnect();
      leaf.removeEventListener("pointermove", onPointer);
      leaf.removeEventListener("pointerdown", onPointer);
      leaf.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("webglcontextlost", lost);
      leaf.classList.remove("is-lit");
      delete leaf.dataset.sky;
      leaf.style.removeProperty("--sky-h");
      leaf.style.removeProperty("--sky-tint");
    };
  }, [lead, nightLead, dayLead]);

  return <canvas ref={canvasRef} className="st-sunlit-canvas" aria-hidden="true" />;
}
