import { createStoryAudio } from '../_shared/storyAudio';
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
  | 'whirl'
  | 'release'
  | 'read'
  | 'bound'
  | 'air';

export function makeElahSound() {
  let currentPhase: ElahPhase = 'armor';
  let armorWeight = 3;
  let stepToggle = false;
  let stonePitch = 0;

  const engine = createStoryAudio({
    seed: 0x73e9a1,
    ambientFreq: 260,
    ambientQ: 0.7,
    ambientTickMs: 2400,
    onAmbientTick(audio) {
      if (currentPhase === 'resolved') return;
      const level = currentPhase === 'sling' ? 0.018 : currentPhase === 'approach' ? 0.015 : 0.01;
      audio.tone(82, 54, 0.24, level, 'sine', 0, 0.015);
      audio.tone(68, 48, 0.22, level * 0.7, 'triangle', 0.34, 0.015);
    },
  });

  function targetAmbientGain() {
    if (currentPhase === 'resolved') return 0.008;
    if (currentPhase === 'sling' || currentPhase === 'approach') return 0.015;
    return 0.012;
  }

  engine.setAmbientTarget(targetAmbientGain());

  function play(kind: ElahSoundKind, reduced = false) {
    if (!engine.isReady()) return;
    if (kind === 'step-heavy') {
      stepToggle = !stepToggle;
      const scale = Math.max(0.4, armorWeight / 3);
      engine.tone(stepToggle ? 116 : 98, 56, 0.075, 0.036 * scale, 'triangle');
      engine.noise(0.055, 'bandpass', 1420, 680, 3.2, 0.022 * scale);
      engine.tone(stepToggle ? 540 : 490, 420, 0.06, 0.013 * scale, 'sine', 0.01);
      return;
    }
    if (kind === 'step-light') {
      stepToggle = !stepToggle;
      const pitch = stepToggle ? 920 : 810;
      engine.noise(0.03, 'bandpass', pitch, pitch * 0.56, 2.2, 0.014);
      engine.tone(stepToggle ? 150 : 136, 86, 0.03, 0.008, 'triangle');
      return;
    }
    if (kind === 'step-brook') {
      stepToggle = !stepToggle;
      engine.noise(0.075, 'bandpass', stepToggle ? 1680 : 1480, 640, 1.5, 0.024);
      engine.tone(stepToggle ? 620 : 540, 820, 0.045, 0.009, 'sine', 0.008);
      return;
    }
    if (kind === 'drop-sword') {
      engine.noise(0.11, 'bandpass', 2400, 1100, 3.4, 0.048);
      engine.tone(1380, 1140, 0.22, 0.042, 'triangle', 0.01);
      engine.tone(680, 560, 0.18, 0.03, 'sine', 0.04);
      engine.tone(140, 66, 0.14, 0.07, 'triangle', 0.06);
      return;
    }
    if (kind === 'drop-coat') {
      engine.tone(98, 44, 0.22, 0.14, 'triangle');
      engine.noise(0.18, 'lowpass', 580, 160, 1.2, 0.09);
      [920, 1240, 760, 1480, 1060].forEach((f, i) =>
        engine.tone(f, f * 0.86, 0.12, 0.028 - i * 0.003, 'triangle', 0.03 + i * 0.032),
      );
      return;
    }
    if (kind === 'drop-helmet') {
      engine.tone(440, 396, 0.42, 0.065, 'sine');
      engine.tone(662, 610, 0.34, 0.038, 'triangle', 0.01);
      engine.tone(1090, 995, 0.22, 0.022, 'sine', 0.02);
      engine.noise(0.08, 'bandpass', 980, 420, 2.2, 0.04, 0.08);
      engine.tone(329.63, 329.63, 0.72, 0.02, 'sine', 0.22, 0.06);
      engine.tone(493.88, 493.88, 0.68, 0.015, 'sine', 0.28, 0.06);
      return;
    }
    if (kind === 'pick') {
      const notes = [880, 988, 1046, 1175, 1318];
      const f = notes[stonePitch++ % notes.length];
      engine.noise(0.06, 'bandpass', 1850, 820, 1.8, 0.024);
      engine.tone(f, f * 0.92, 0.09, 0.032, 'sine');
      engine.tone(f * 1.5, f * 1.42, 0.075, 0.015, 'triangle', 0.025);
      engine.tone(1560 + (stonePitch % 3) * 140, 1980, 0.04, 0.011, 'sine', 0.07);
      return;
    }
    if (kind === 'challenge') {
      engine.tone(196, 196, 0.85, 0.042, 'triangle', 0, 0.055);
      engine.tone(293.66, 293.66, 0.9, 0.034, 'sine', 0.06, 0.06);
      engine.tone(392, 392, 0.8, 0.018, 'sine', 0.14, 0.06);
      return;
    }
    if (kind === 'whirl') {
      engine.noise(0.16, 'bandpass', 380, 740, 2.2, 0.018);
      return;
    }
    if (kind === 'release') {
      engine.noise(0.16, 'bandpass', 520, 1850, 2.1, 0.058, 0);
      engine.noise(0.05, 'highpass', 1900, 900, 1.4, 0.064, 0.1);
      engine.tone(340, 680, 0.11, 0.034, 'sine', 0.03);
      const delay = reduced ? 0.04 : SLING_FLIGHT_SECONDS;
      engine.tone(118, 36, 0.38, 0.19, 'triangle', delay);
      engine.noise(0.26, 'lowpass', 420, 92, 1.1, 0.12, delay);
      engine.tone(520, 430, 0.28, 0.036, 'sine', delay + 0.02);
      engine.tone(293.66, 293.66, 1.35, 0.026, 'triangle', delay + 0.42, 0.14);
      engine.tone(440, 440, 1.25, 0.019, 'sine', delay + 0.50, 0.14);
      engine.tone(587.33, 587.33, 1.05, 0.012, 'sine', delay + 0.62, 0.14);
      return;
    }
    if (kind === 'read') {
      engine.tone(293.66, 293.66, 0.8, 0.026, 'sine', 0, 0.045);
      engine.tone(440, 440, 0.76, 0.018, 'sine', 0.05, 0.045);
      engine.tone(587.33, 587.33, 0.68, 0.011, 'sine', 0.1, 0.04);
      return;
    }
    if (kind === 'bound') {
      engine.tone(132, 74, 0.11, 0.045, 'triangle');
      engine.noise(0.06, 'bandpass', 720, 360, 2.1, 0.02);
      return;
    }
    engine.noise(0.08, 'bandpass', 460, 220, 1.6, 0.024);
    engine.tone(142, 68, 0.09, 0.04, 'triangle');
  }

  function updateAmbiance(phase: ElahPhase, armorCount: number) {
    currentPhase = phase;
    armorWeight = armorCount;
    engine.setAmbientTarget(targetAmbientGain());
  }

  return {
    unlock: engine.unlock,
    play,
    updateAmbiance,
    setEnabled: engine.setEnabled,
    setPaused: engine.setPaused,
    close: engine.close,
  };
}
