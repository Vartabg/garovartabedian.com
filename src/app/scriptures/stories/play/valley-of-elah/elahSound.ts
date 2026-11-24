import { SLING_FLIGHT_SECONDS, type ElahPhase } from './elahGame';

export type ElahSound = ReturnType<typeof makeElahSound>;
export type ElahSoundKind =
  | 'step-heavy'
  | 'step-light'
  | 'step-brook'
  | 'drop-sword'
  | 'drop-coat'
  | 'drop-helmet'
  | 'pick'
  | 'challenge'
  | 'release'
  | 'read'
  | 'bound'
  | 'air';

export function makeElahSound() {
  let audio: AudioContext | undefined;
  let master: GainNode | undefined;
  let sfx: GainNode | undefined;
  let ambientGain: GainNode | undefined;
  let ambientSource: AudioBufferSourceNode | undefined;
  let noiseBuffer: AudioBuffer | undefined;
  let ambientTimer: number | undefined;

  let enabled = true;
  let paused = false;
  let currentPhase: ElahPhase = 'armor';
  let armorWeight = 3;
  let stepToggle = false;
  let stonePitch = 0;

  function ensureNoise(ctx: AudioContext) {
    if (noiseBuffer) return noiseBuffer;
    const length = Math.floor(ctx.sampleRate * 2);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 0x73e9a1;
    for (let i = 0; i < length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      data[i] = (seed / 0xffffffff) * 2 - 1;
    }
    noiseBuffer = buffer;
    return buffer;
  }

  function targetAmbientGain() {
    if (currentPhase === 'resolved') return 0.008;
    if (currentPhase === 'sling' || currentPhase === 'approach') return 0.015;
    return 0.012;
  }

  function syncGain() {
    if (!audio || !master || audio.state === 'closed') return;
    const now = audio.currentTime;
    const open = enabled && !paused;
    try {
      master.gain.setTargetAtTime(open ? 1 : 0, now, 0.03);
      if (ambientGain) {
        ambientGain.gain.setTargetAtTime(open ? targetAmbientGain() : 0, now, 0.3);
      }
      if (!open && audio.state === 'running') void audio.suspend().catch(() => {});
      else if (open && audio.state === 'suspended') void audio.resume().catch(() => {});
    } catch { /* Silent fallback. */ }
  }

  function tone(
    frequency: number,
    end: number,
    duration: number,
    level: number,
    wave: OscillatorType,
    delay = 0,
    attack = 0.006,
  ) {
    if (!audio || !sfx || !enabled || paused || audio.state === 'closed') return;
    try {
      const now = audio.currentTime + delay;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(frequency, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(level, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(sfx);
      osc.start(now);
      osc.stop(now + duration + 0.02);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch { /* Ignore audio scheduling errors. */ }
  }

  function noise(
    duration: number,
    type: BiquadFilterType,
    freqStart: number,
    freqEnd: number,
    q: number,
    level: number,
    delay = 0,
  ) {
    if (!audio || !sfx || !enabled || paused || audio.state === 'closed') return;
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
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(level, now + 0.007);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(sfx);
      src.start(now, (Math.random() * 1.4) % 1.4, duration + 0.02);
      src.onended = () => {
        src.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
    } catch { /* Ignore noise scheduling errors. */ }
  }

  function startAmbient(ctx: AudioContext) {
    if (ambientSource || !ambientGain) return;
    try {
      const src = ctx.createBufferSource();
      src.buffer = ensureNoise(ctx);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 260;
      filter.Q.value = 0.7;
      src.connect(filter);
      filter.connect(ambientGain);
      src.start();
      ambientSource = src;
      // Distant Philistine hill drum pulse while standoff holds; stops once the valley turns.
      ambientTimer = window.setInterval(() => {
        if (!audio || !enabled || paused || audio.state !== 'running') return;
        if (currentPhase === 'resolved') return;
        const level = currentPhase === 'sling' ? 0.018 : currentPhase === 'approach' ? 0.015 : 0.01;
        tone(82, 54, 0.24, level, 'sine', 0, 0.015);
        tone(68, 48, 0.22, level * 0.7, 'triangle', 0.34, 0.015);
      }, 2400);
    } catch { /* Playable without ambient sound. */ }
  }

  function unlock() {
    const AudioCtor = window.AudioContext
      ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!enabled || !AudioCtor) return;
    try {
      if (!audio) {
        audio = new AudioCtor();
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
    } catch { /* Playable in silence. */ }
  }

  function play(kind: ElahSoundKind, reduced = false) {
    if (!audio || !enabled || paused || audio.state === 'closed') return;
    if (kind === 'step-heavy') {
      stepToggle = !stepToggle;
      const scale = Math.max(0.4, armorWeight / 3);
      tone(stepToggle ? 116 : 98, 56, 0.075, 0.036 * scale, 'triangle');
      noise(0.055, 'bandpass', 1420, 680, 3.2, 0.022 * scale);
      tone(stepToggle ? 540 : 490, 420, 0.06, 0.013 * scale, 'sine', 0.01);
      return;
    }
    if (kind === 'step-light') {
      stepToggle = !stepToggle;
      const pitch = stepToggle ? 920 : 810;
      noise(0.03, 'bandpass', pitch, pitch * 0.56, 2.2, 0.014);
      tone(stepToggle ? 150 : 136, 86, 0.03, 0.008, 'triangle');
      return;
    }
    if (kind === 'step-brook') {
      stepToggle = !stepToggle;
      noise(0.075, 'bandpass', stepToggle ? 1680 : 1480, 640, 1.5, 0.024);
      tone(stepToggle ? 620 : 540, 820, 0.045, 0.009, 'sine', 0.008);
      return;
    }
    if (kind === 'drop-sword') {
      noise(0.11, 'bandpass', 2400, 1100, 3.4, 0.048);
      tone(1380, 1140, 0.22, 0.042, 'triangle', 0.01);
      tone(680, 560, 0.18, 0.03, 'sine', 0.04);
      tone(140, 66, 0.14, 0.07, 'triangle', 0.06);
      return;
    }
    if (kind === 'drop-coat') {
      tone(98, 44, 0.22, 0.14, 'triangle');
      noise(0.18, 'lowpass', 580, 160, 1.2, 0.09);
      [920, 1240, 760, 1480, 1060].forEach((f, i) =>
        tone(f, f * 0.86, 0.12, 0.028 - i * 0.003, 'triangle', 0.03 + i * 0.032),
      );
      return;
    }
    if (kind === 'drop-helmet') {
      tone(440, 396, 0.42, 0.065, 'sine');
      tone(662, 610, 0.34, 0.038, 'triangle', 0.01);
      tone(1090, 995, 0.22, 0.022, 'sine', 0.02);
      noise(0.08, 'bandpass', 980, 420, 2.2, 0.04, 0.08);
      return;
    }
    if (kind === 'pick') {
      const notes = [880, 988, 1046, 1175, 1318];
      const f = notes[stonePitch++ % notes.length];
      noise(0.055, 'bandpass', 1800, 820, 1.8, 0.022);
      tone(f, f * 0.92, 0.09, 0.032, 'sine');
      tone(f * 1.5, f * 1.42, 0.07, 0.014, 'triangle', 0.025);
      return;
    }
    if (kind === 'challenge') {
      tone(196, 196, 0.85, 0.042, 'triangle', 0, 0.055);
      tone(293.66, 293.66, 0.9, 0.034, 'sine', 0.06, 0.06);
      tone(392, 392, 0.8, 0.018, 'sine', 0.14, 0.06);
      return;
    }
    if (kind === 'release') {
      // Leather sling whoosh and whip-snap
      noise(0.16, 'bandpass', 520, 1850, 2.1, 0.055, 0);
      noise(0.05, 'highpass', 1900, 900, 1.4, 0.06, 0.1);
      tone(340, 680, 0.11, 0.032, 'sine', 0.03);
      // Distant bronze impact thud & deep earth settle
      const delay = reduced ? 0.04 : SLING_FLIGHT_SECONDS;
      tone(118, 38, 0.34, 0.18, 'triangle', delay);
      noise(0.24, 'lowpass', 420, 95, 1.1, 0.11, delay);
      tone(520, 430, 0.28, 0.034, 'sine', delay + 0.02);
      tone(293.66, 293.66, 1.25, 0.024, 'sine', delay + 0.38, 0.1);
      tone(440, 440, 1.15, 0.016, 'sine', delay + 0.46, 0.1);
      return;
    }
    if (kind === 'read') {
      tone(293.66, 293.66, 0.8, 0.026, 'sine', 0, 0.045);
      tone(440, 440, 0.76, 0.018, 'sine', 0.05, 0.045);
      tone(587.33, 587.33, 0.68, 0.011, 'sine', 0.1, 0.04);
      return;
    }
    if (kind === 'bound') {
      tone(132, 74, 0.11, 0.045, 'triangle');
      noise(0.06, 'bandpass', 720, 360, 2.1, 0.02);
      return;
    }
    noise(0.08, 'bandpass', 460, 220, 1.6, 0.024);
    tone(142, 68, 0.09, 0.04, 'triangle');
  }

  function updateAmbiance(phase: ElahPhase, armorCount: number) {
    currentPhase = phase;
    armorWeight = armorCount;
    syncGain();
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
      if (ambientTimer !== undefined) {
        window.clearInterval(ambientTimer);
        ambientTimer = undefined;
      }
      try {
        ambientSource?.stop();
        ambientSource?.disconnect();
      } catch { /* Already stopped. */ }
      ambientSource = undefined;
      if (audio && audio.state !== 'closed') void audio.close().catch(() => {});
    },
  };
}
