export type CourtSound = ReturnType<typeof makeCourtSound>;
export type SoundKind =
  | "table" | "seat" | "gate" | "air"
  | "teach" | "heal" | "answer" | "dusk" | "depart"
  | "coin" | "step";

export function makeCourtSound() {
  let audio: AudioContext | undefined;
  let master: GainNode | undefined;
  let sfx: GainNode | undefined;
  let ambientGain: GainNode | undefined;
  let ambientSource: AudioBufferSourceNode | undefined;
  let noiseBuffer: AudioBuffer | undefined;
  let ambientTimer: number | undefined;

  let enabled = true;
  let paused = false;
  let remainingStalls = 5;
  let passageBarred = false;
  let tablesLeft = 3;
  let seatsLeft = 2;
  let stepToggle = false;
  let coinPitch = 0;

  function ensureNoise(ctx: AudioContext) {
    if (noiseBuffer) return noiseBuffer;
    const length = Math.floor(ctx.sampleRate * 2);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 0x51a7c3;
    for (let i = 0; i < length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      data[i] = (seed / 0xffffffff) * 2 - 1;
    }
    noiseBuffer = buffer;
    return buffer;
  }

  function targetAmbientGain() {
    if (remainingStalls <= 0 && passageBarred) return 0;
    return .006 + remainingStalls * .0055;
  }

  function syncGain() {
    if (!audio || !master || audio.state === "closed") return;
    const now = audio.currentTime;
    const open = enabled && !paused;
    try {
      master.gain.setTargetAtTime(open ? 1 : 0, now, .03);
      if (ambientGain) {
        ambientGain.gain.setTargetAtTime(open ? targetAmbientGain() : 0, now, .28);
      }
      if (!open && audio.state === "running") void audio.suspend().catch(() => { });
      else if (open && audio.state === "suspended") void audio.resume().catch(() => { });
    } catch { /* Silent fallback. */ }
  }

  function startAmbient(ctx: AudioContext) {
    if (ambientSource || !ambientGain) return;
    try {
      const src = ctx.createBufferSource();
      src.buffer = ensureNoise(ctx);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 340;
      filter.Q.value = .85;
      src.connect(filter);
      filter.connect(ambientGain);
      src.start();
      ambientSource = src;
      ambientTimer = window.setInterval(() => {
        if (!audio || !enabled || paused || audio.state !== "running" || remainingStalls <= 0) return;
        const scale = remainingStalls / 5;
        if (seatsLeft > 0 && Math.random() < .42) {
          const base = 470 + Math.random() * 75;
          tone(base, base * 1.18, .18, .009 * scale, "sine", 0);
          tone(base * 1.16, base * .92, .22, .008 * scale, "sine", .16);
        } else if (tablesLeft > 0 && Math.random() < .35) {
          const f = 1850 + Math.random() * 650;
          tone(f, f * .9, .09, .006 * scale, "sine", 0);
        }
      }, 2100);
    } catch { /* Playable without ambient sound. */ }
  }

  function unlock() {
    const Audio = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!enabled || !Audio) return;
    try {
      if (!audio) {
        audio = new Audio();
        master = audio.createGain();
        master.gain.value = enabled && !paused ? 1 : 0;
        master.connect(audio.destination);
        sfx = audio.createGain();
        sfx.gain.value = 1;
        sfx.connect(master);
        ambientGain = audio.createGain();
        ambientGain.gain.value = 0;
        ambientGain.connect(master);
        startAmbient(audio);
      }
      syncGain();
    } catch { /* The court is also playable in silence. */ }
  }

  function tone(frequency: number, end: number, duration: number, level: number, wave: OscillatorType, delay = 0, attack = .006) {
    if (!audio || !sfx || !enabled || paused || audio.state === "closed") return;
    try {
      const now = audio.currentTime + delay, osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(frequency, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + duration);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(level, now + attack);
      gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
      osc.connect(gain); gain.connect(sfx);
      osc.start(now); osc.stop(now + duration + .02);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    } catch { /* Ignore audio scheduling errors. */ }
  }

  function noise(duration: number, type: BiquadFilterType, freqStart: number, freqEnd: number, q: number, level: number, delay = 0) {
    if (!audio || !sfx || !enabled || paused || audio.state === "closed") return;
    try {
      const buf = ensureNoise(audio);
      const now = audio.currentTime + delay;
      const src = audio.createBufferSource();
      src.buffer = buf;
      const filter = audio.createBiquadFilter();
      filter.type = type;
      filter.Q.value = q;
      filter.frequency.setValueAtTime(freqStart, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), now + duration);
      const gain = audio.createGain();
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(level, now + .007);
      gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
      src.connect(filter); filter.connect(gain); gain.connect(sfx);
      src.start(now, (Math.random() * 1.4) % 1.4, duration + .02);
      src.onended = () => { src.disconnect(); filter.disconnect(); gain.disconnect(); };
    } catch { /* Ignore noise scheduling errors. */ }
  }

  function play(kind: SoundKind) {
    if (!audio || !enabled || paused || audio.state === "closed") return;
    if (kind === "step") {
      stepToggle = !stepToggle;
      const pitch = stepToggle ? 880 : 760;
      noise(.034, "bandpass", pitch, pitch * .58, 2.4, .016);
      tone(stepToggle ? 155 : 138, 82, .035, .01, "triangle");
      return;
    }
    if (kind === "coin") {
      const freqs = [2140, 2480, 1980, 2710, 2290];
      const f = freqs[coinPitch++ % freqs.length];
      tone(f, f * .9, .11, .024, "sine");
      tone(f * 1.48, f * 1.38, .08, .01, "triangle", .01);
      return;
    }
    if (kind === "air") {
      noise(.1, "bandpass", 420, 190, 1.5, .028);
      tone(135, 55, .1, .065, "triangle");
      return;
    }
    if (kind === "gate") {
      noise(.07, "lowpass", 320, 120, 1, .055);
      tone(185, 108, .2, .11, "triangle");
      tone(294, 261, .28, .048, "sine", .09);
      tone(740, 620, .09, .018, "sine", .14);
      return;
    }
    if (kind === "teach") {
      tone(293.66, 293.66, .75, .028, "sine", 0, .045);
      tone(440, 440, .7, .02, "sine", .03, .045);
      tone(587.33, 587.33, .62, .011, "sine", .07, .04);
      return;
    }
    if (kind === "heal") {
      tone(329.63, 329.63, .95, .028, "sine", 0, .05);
      tone(392.0, 392.0, .9, .022, "sine", .12, .05);
      tone(493.88, 493.88, .92, .017, "triangle", .24, .06);
      return;
    }
    if (kind === "answer") {
      tone(261.63, 261.63, .75, .028, "sine", 0, .04);
      tone(392.0, 392.0, .72, .02, "sine", .08, .04);
      tone(329.63, 329.63, .8, .018, "sine", .16, .045);
      return;
    }
    if (kind === "dusk") {
      noise(.8, "lowpass", 420, 180, .9, .014);
      tone(220.0, 220.0, 1.3, .024, "sine", .08, .12);
      tone(329.63, 329.63, 1.2, .016, "sine", .18, .12);
      return;
    }
    if (kind === "depart") {
      for (let i = 0; i < 3; i++) {
        noise(.04, "bandpass", 820 - i * 80, 440, 2.2, .016 - i * .004, i * .36);
      }
      tone(293.66, 293.66, 1.4, .026, "sine", .12, .09);
      tone(440.0, 440.0, 1.3, .018, "sine", .24, .09);
      tone(587.33, 587.33, 1.25, .012, "sine", .38, .09);
      return;
    }
    if (kind === "table") {
      tone(107, 34, .22, .22, "triangle");
      noise(.14, "lowpass", 360, 85, 1.1, .14);
      noise(.15, "bandpass", 680, 310, 1.4, .055, .07);
      tone(70, 40, .12, .08, "sawtooth", .095);
      tone(940, 860, .15, .026, "triangle", .11);
      tone(1390, 1260, .13, .02, "sine", .14);
      [1746, 2310, 1484, 2620, 1832, 2190, 1560].forEach((f, i) =>
        tone(f, f * .83, .16, .048 - i * .004, "sine", .07 + i * .046));
      return;
    }
    tone(138, 46, .17, .17, "triangle");
    noise(.11, "bandpass", 560, 240, 1.4, .09);
    for (let i = 0; i < 4; i++) {
      noise(.075, "bandpass", 1320 - i * 110, 460, 1.6, .042 - i * .006, .07 + i * .078);
    }
    tone(480, 610, .18, .024, "sine", .11);
    tone(560, 470, .2, .02, "sine", .24);
  }

  function updateAmbiance(stalls: number, barred: boolean, tables: number, seats: number) {
    const wasOpen = remainingStalls > 0 || !passageBarred;
    remainingStalls = stalls;
    passageBarred = barred;
    tablesLeft = tables;
    seatsLeft = seats;
    syncGain();
    if (wasOpen && stalls === 0 && barred) {
      tone(293.66, 293.66, 1.1, .024, "sine", .22, .09);
      tone(440, 440, 1.0, .016, "sine", .28, .09);
    }
  }

  return {
    unlock,
    play,
    updateAmbiance,
    setEnabled(value: boolean) {
      enabled = value;
      if (value) unlock();
      else syncGain();
    },
    setPaused(value: boolean) {
      paused = value;
      syncGain();
    },
    close() {
      if (ambientTimer !== undefined) { window.clearInterval(ambientTimer); ambientTimer = undefined; }
      try { ambientSource?.stop(); ambientSource?.disconnect(); } catch { /* Already stopped. */ }
      ambientSource = undefined;
      if (audio && audio.state !== "closed") void audio.close().catch(() => { });
    },
  };
}
