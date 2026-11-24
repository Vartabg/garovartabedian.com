export interface StoryAudioOptions {
  seed?: number;
  ambientFreq: number;
  ambientQ: number;
  ambientTickMs?: number;
  onAmbientTick?: (engine: StoryAudioEngine) => void;
}

export interface StoryAudioEngine {
  unlock: () => void;
  isReady: () => boolean;
  isRunning: () => boolean;
  tone: (
    frequency: number,
    end: number,
    duration: number,
    level: number,
    wave: OscillatorType,
    delay?: number,
    attack?: number,
    detuneCents?: number,
  ) => void;
  noise: (
    duration: number,
    type: BiquadFilterType,
    freqStart: number,
    freqEnd: number,
    q: number,
    level: number,
    delay?: number,
  ) => void;
  setAmbientTarget: (gain: number, rampSeconds?: number) => void;
  setAmbientFilter: (freq: number, q?: number, rampSeconds?: number) => void;
  setEnabled: (value: boolean) => void;
  setPaused: (value: boolean) => void;
  close: () => void;
}

const SUSPEND_DELAY_MS = 75;

/**
 * Procedural Web Audio substrate shared by 2D playable stories:
 * - Lazy unlock with soft master limiter (DynamicsCompressorNode when supported)
 * - Click-free fade-out before delayed AudioContext suspend (cancellable on resume/close)
 * - Pre-unlock cached ambient gain & live filter frequency/Q modulation
 * - Deterministic noise buffer, pause/blur/mute ramping, and full teardown on close()
 */
export function createStoryAudio(options: StoryAudioOptions): StoryAudioEngine {
  const initialSeed = options.seed ?? 0x51a7c3;
  let audio: AudioContext | undefined;
  let master: GainNode | undefined;
  let sfx: GainNode | undefined;
  let ambientGain: GainNode | undefined;
  let ambientFilter: BiquadFilterNode | undefined;
  let ambientSource: AudioBufferSourceNode | undefined;
  let noiseBuffer: AudioBuffer | undefined;
  let ambientTimer: ReturnType<typeof setInterval> | undefined;
  let suspendTimer: ReturnType<typeof setTimeout> | undefined;

  let enabled = true;
  let paused = false;
  let ambientTarget = 0;
  let ambientFreqTarget = options.ambientFreq;
  let ambientQTarget = options.ambientQ;

  function ensureNoise(ctx: AudioContext) {
    if (noiseBuffer) return noiseBuffer;
    const length = Math.floor(ctx.sampleRate * 2);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = initialSeed;
    for (let i = 0; i < length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      data[i] = (seed / 0xffffffff) * 2 - 1;
    }
    noiseBuffer = buffer;
    return buffer;
  }

  function clearSuspendTimer() {
    if (suspendTimer !== undefined) {
      clearTimeout(suspendTimer);
      suspendTimer = undefined;
    }
  }

  function applyFilterParam(param: AudioParam, value: number, now: number, rampSeconds: number) {
    if (typeof param.setTargetAtTime === 'function') {
      param.setTargetAtTime(value, now, rampSeconds);
    } else {
      param.value = value;
    }
  }

  function syncAmbientFilter(rampSeconds = 0.25) {
    if (!audio || !ambientFilter || audio.state === 'closed') return;
    try {
      const now = audio.currentTime;
      applyFilterParam(ambientFilter.frequency, ambientFreqTarget, now, rampSeconds);
      applyFilterParam(ambientFilter.Q, ambientQTarget, now, rampSeconds);
    } catch { /* Silent fallback. */ }
  }

  function syncGain(ambientRamp = 0.28) {
    if (!audio || !master || audio.state === 'closed') return;
    const now = audio.currentTime;
    const open = enabled && !paused;
    try {
      master.gain.setTargetAtTime(open ? 1 : 0, now, open ? 0.025 : 0.015);
      if (ambientGain) {
        ambientGain.gain.setTargetAtTime(open ? ambientTarget : 0, now, ambientRamp);
      }
      if (open) {
        clearSuspendTimer();
        if (audio.state === 'suspended') void audio.resume().catch(() => {});
      } else if (audio.state === 'running' && suspendTimer === undefined) {
        // Let the 15 ms gain fade reach silence before suspending to avoid speaker pops.
        suspendTimer = setTimeout(() => {
          suspendTimer = undefined;
          if (audio && audio.state === 'running' && (!enabled || paused)) {
            void audio.suspend().catch(() => {});
          }
        }, SUSPEND_DELAY_MS);
      }
    } catch { /* Silent fallback. */ }
  }

  function isReady() {
    return Boolean(audio && sfx && enabled && !paused && audio.state !== 'closed');
  }

  function isRunning() {
    return Boolean(audio && enabled && !paused && audio.state === 'running');
  }

  function tone(
    frequency: number,
    end: number,
    duration: number,
    level: number,
    wave: OscillatorType,
    delay = 0,
    attack = 0.006,
    detuneCents = 0,
  ) {
    if (!audio || !sfx || !enabled || paused || audio.state === 'closed') return;
    try {
      const now = audio.currentTime + delay;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = wave;
      if (detuneCents !== 0 && osc.detune) {
        osc.detune.value = detuneCents;
      }
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
      filter.frequency.value = ambientFreqTarget;
      filter.Q.value = ambientQTarget;
      src.connect(filter);
      filter.connect(ambientGain);
      src.start();
      ambientFilter = filter;
      ambientSource = src;
      if (options.onAmbientTick && options.ambientTickMs) {
        // Keep interval registered across pause/blur; guard with isRunning() and clear only on close().
        ambientTimer = setInterval(() => {
          if (!isRunning()) return;
          options.onAmbientTick?.(engine);
        }, options.ambientTickMs);
      }
    } catch { /* Playable without ambient sound. */ }
  }

  function unlock() {
    const win = typeof window !== 'undefined' ? window : undefined;
    const AudioCtor = win?.AudioContext
      ?? (win as (Window & { webkitAudioContext?: typeof AudioContext }) | undefined)?.webkitAudioContext;
    if (!enabled || !AudioCtor) return;
    try {
      if (!audio) {
        audio = new AudioCtor();
        master = audio.createGain();
        master.gain.value = enabled && !paused ? 1 : 0;
        if (typeof audio.createDynamicsCompressor === 'function') {
          const limiter = audio.createDynamicsCompressor();
          limiter.threshold.value = -12;
          limiter.knee.value = 12;
          limiter.ratio.value = 6;
          limiter.attack.value = 0.003;
          limiter.release.value = 0.15;
          master.connect(limiter);
          limiter.connect(audio.destination);
        } else {
          master.connect(audio.destination);
        }
        sfx = audio.createGain();
        sfx.gain.value = 1;
        sfx.connect(master);
        ambientGain = audio.createGain();
        ambientGain.gain.value = 0;
        ambientGain.connect(master);
        startAmbient(audio);
      }
      syncGain();
      syncAmbientFilter(0.05);
    } catch { /* Playable in silence. */ }
  }

  const engine: StoryAudioEngine = {
    unlock,
    isReady,
    isRunning,
    tone,
    noise,
    setAmbientTarget(gain: number, rampSeconds = 0.28) {
      ambientTarget = Math.max(0, gain);
      syncGain(rampSeconds);
    },
    setAmbientFilter(freq: number, q = ambientQTarget, rampSeconds = 0.25) {
      ambientFreqTarget = Math.max(40, freq);
      ambientQTarget = Math.max(0.1, q);
      syncAmbientFilter(rampSeconds);
    },
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
      clearSuspendTimer();
      if (ambientTimer !== undefined) {
        clearInterval(ambientTimer);
        ambientTimer = undefined;
      }
      try {
        ambientSource?.stop();
        ambientSource?.disconnect();
        ambientFilter?.disconnect();
      } catch { /* Already stopped. */ }
      ambientSource = undefined;
      ambientFilter = undefined;
      if (audio && audio.state !== 'closed') void audio.close().catch(() => {});
    },
  };

  return engine;
}
