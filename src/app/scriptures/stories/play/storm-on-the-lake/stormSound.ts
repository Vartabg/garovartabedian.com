import { createStoryAudio } from '../_shared/storyAudio';
import type { StormPhase } from './stormGame';

export type StormSound = ReturnType<typeof makeStormSound>;
export type StormSoundKind =
  | 'step'
  | 'sail'
  | 'oars'
  | 'reef'
  | 'bail'
  | 'wave-slam'
  | 'wake'
  | 'still'
  | 'read';

export function makeStormSound() {
  let phase: StormPhase = 'launch';
  let intensity = 0;
  let stepToggle = false;
  let tickCount = 0;

  const engine = createStoryAudio({
    seed: 0x3a91e7,
    ambientFreq: 260,
    ambientQ: 0.7,
    ambientTickMs: 1550,
    onAmbientTick(audio) {
      tickCount++;
      if (phase === 'calm') {
        if (tickCount % 2 === 0) {
          audio.noise(0.18, 'bandpass', 540, 250, 2.2, 0.008);
        }
        return;
      }
      if (intensity > 0.2) {
        // Short crisp breaking swells (<= 0.30 s) + occasional wet cedar timber hull creak
        audio.noise(0.28, 'lowpass', 520 + intensity * 380, 140, 1.0, 0.042 * intensity);
        if (tickCount % 2 === 0) {
          audio.noise(0.22, 'bandpass', 1240, 620, 1.6, 0.02 * intensity, 0.07);
        }
        if (tickCount % 3 === 0) {
          // Subtle groaning cedar hull timber under wave torque
          audio.tone(114, 92, 0.22, 0.015 * intensity, 'triangle', 0.05, 0.04);
        }
      } else {
        audio.noise(0.22, 'bandpass', 460, 230, 1.8, 0.01);
      }
    },
  });

  function ambientLevelFor(p: StormPhase, storm: number): number {
    if (p === 'calm') return 0.0025;
    if (p === 'launch') return 0.012;
    return 0.028 + storm * 0.045;
  }

  function ambientFilterFor(p: StormPhase, storm: number): [number, number] {
    if (p === 'calm') return [190, 0.6];
    if (p === 'launch') return [260, 0.7];
    return [520 + storm * 240, 0.88];
  }

  engine.setAmbientTarget(ambientLevelFor('launch', 0));
  engine.setAmbientFilter(260, 0.7, 0.05);

  function play(kind: StormSoundKind) {
    if (!engine.isReady()) return;
    if (kind === 'step') {
      stepToggle = !stepToggle;
      engine.tone(stepToggle ? 142 : 124, 78, 0.055, 0.016, 'triangle');
      engine.noise(0.036, 'bandpass', stepToggle ? 980 : 860, 440, 2.0, 0.016);
      return;
    }
    if (kind === 'sail') {
      // Climbing halyard cleat + linen canvas snapping open
      engine.tone(185, 132, 0.18, 0.045, 'triangle');
      engine.noise(0.28, 'bandpass', 320, 880, 1.1, 0.068, 0.06);
      engine.tone(293.66, 329.63, 0.36, 0.018, 'sine', 0.14);
      return;
    }
    if (kind === 'oars') {
      // Wooden oarlock groan + two-stroke water pull
      engine.tone(162, 118, 0.14, 0.036, 'triangle');
      engine.noise(0.26, 'lowpass', 740, 220, 1.2, 0.072, 0.03);
      engine.noise(0.22, 'lowpass', 700, 200, 1.2, 0.062, 0.28);
      engine.noise(0.16, 'bandpass', 1420, 640, 1.8, 0.024, 0.12);
      return;
    }
    if (kind === 'reef') {
      engine.noise(0.22, 'bandpass', 1200, 380, 1.2, 0.085);
      engine.tone(128, 52, 0.18, 0.09, 'triangle', 0.06);
      return;
    }
    if (kind === 'bail') {
      engine.noise(0.14, 'bandpass', 920, 1850, 1.4, 0.055);
      engine.noise(0.22, 'bandpass', 1750, 520, 1.3, 0.068, 0.11);
      engine.tone(420, 280, 0.09, 0.024, 'sine', 0.05);
      return;
    }
    if (kind === 'wave-slam') {
      // Heavy rogue wave slamming over cedar bow + foaming wash into hull!
      engine.tone(94, 38, 0.34, 0.16, 'triangle');
      engine.noise(0.32, 'lowpass', 620, 120, 1.0, 0.13, 0.01);
      engine.noise(0.28, 'bandpass', 1580, 480, 1.3, 0.072, 0.06);
      return;
    }
    if (kind === 'wake') {
      engine.tone(196, 196, 0.65, 0.036, 'triangle', 0, 0.04);
      engine.tone(293.66, 293.66, 0.72, 0.032, 'sine', 0.08, 0.05);
      engine.tone(392, 392, 0.68, 0.018, 'sine', 0.16, 0.05);
      return;
    }
    if (kind === 'still') {
      // Instant miraculous storm cutoff (< 0.20 s) + low filter slam, then warm open-fifth stillness chord!
      engine.setAmbientTarget(0.002, 0.035);
      engine.setAmbientFilter(190, 0.6, 0.04);
      engine.tone(220, 220, 1.75, 0.032, 'sine', 0.18, 0.09, -2);
      engine.tone(329.63, 329.63, 1.65, 0.024, 'sine', 0.26, 0.09, 2);
      engine.tone(440, 440, 1.5, 0.016, 'sine', 0.36, 0.09, -1);
      engine.tone(659.25, 659.25, 1.3, 0.009, 'sine', 0.46, 0.1, 3);
      return;
    }
    // Calm verse reading resonance
    engine.tone(293.66, 293.66, 0.82, 0.026, 'sine', 0, 0.045, -2);
    engine.tone(440, 440, 0.76, 0.018, 'sine', 0.06, 0.045, 2);
    engine.tone(587.33, 587.33, 0.68, 0.011, 'sine', 0.12, 0.045, 0);
  }

  function updateAmbiance(nextPhase: StormPhase, nextIntensity: number) {
    const calmedNow = phase !== 'calm' && nextPhase === 'calm';
    phase = nextPhase;
    intensity = nextIntensity;
    if (!calmedNow) {
      engine.setAmbientTarget(ambientLevelFor(nextPhase, nextIntensity), 0.25);
      const [freq, q] = ambientFilterFor(nextPhase, nextIntensity);
      engine.setAmbientFilter(freq, q, 0.35);
    }
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
