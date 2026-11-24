import { createStoryAudio } from "../_shared/storyAudio";

export type CourtSound = ReturnType<typeof makeCourtSound>;
export type SoundKind =
  | "table" | "seat" | "gate" | "air"
  | "teach" | "heal" | "answer" | "dusk" | "depart"
  | "coin" | "step";

export function makeCourtSound() {
  let remainingStalls = 5;
  let passageBarred = false;
  let tablesLeft = 3;
  let seatsLeft = 2;
  let stepToggle = false;
  let coinPitch = 0;

  const engine = createStoryAudio({
    seed: 0x51a7c3,
    ambientFreq: 340,
    ambientQ: .85,
    ambientTickMs: 2100,
    onAmbientTick(audio) {
      if (remainingStalls <= 0) return;
      const scale = remainingStalls / 5;
      if (seatsLeft > 0 && Math.random() < .42) {
        const base = 470 + Math.random() * 75;
        audio.tone(base, base * 1.18, .18, .009 * scale, "sine", 0);
        audio.tone(base * 1.16, base * .92, .22, .008 * scale, "sine", .16);
      } else if (tablesLeft > 0 && Math.random() < .35) {
        const f = 1850 + Math.random() * 650;
        audio.tone(f, f * .9, .09, .006 * scale, "sine", 0);
      }
    },
  });

  function targetAmbientGain() {
    if (remainingStalls <= 0 && passageBarred) return 0;
    return .006 + remainingStalls * .0055;
  }

  engine.setAmbientTarget(targetAmbientGain());

  function play(kind: SoundKind) {
    if (!engine.isReady()) return;
    if (kind === "step") {
      stepToggle = !stepToggle;
      const pitch = stepToggle ? 880 : 760;
      engine.noise(.034, "bandpass", pitch, pitch * .58, 2.4, .016);
      engine.tone(stepToggle ? 155 : 138, 82, .035, .01, "triangle");
      return;
    }
    if (kind === "coin") {
      const freqs = [2140, 2480, 1980, 2710, 2290];
      const f = freqs[coinPitch++ % freqs.length];
      engine.tone(f, f * .9, .11, .024, "sine");
      engine.tone(f * 1.48, f * 1.38, .08, .01, "triangle", .01);
      return;
    }
    if (kind === "air") {
      engine.noise(.1, "bandpass", 420, 190, 1.5, .028);
      engine.tone(135, 55, .1, .065, "triangle");
      return;
    }
    if (kind === "gate") {
      engine.noise(.07, "lowpass", 320, 120, 1, .055);
      engine.tone(185, 108, .2, .11, "triangle");
      engine.tone(294, 261, .28, .048, "sine", .09);
      engine.tone(740, 620, .09, .018, "sine", .14);
      return;
    }
    if (kind === "teach") {
      engine.tone(293.66, 293.66, .75, .028, "sine", 0, .045);
      engine.tone(440, 440, .7, .02, "sine", .03, .045);
      engine.tone(587.33, 587.33, .62, .011, "sine", .07, .04);
      return;
    }
    if (kind === "heal") {
      engine.tone(329.63, 329.63, .95, .028, "sine", 0, .05);
      engine.tone(392.0, 392.0, .9, .022, "sine", .12, .05);
      engine.tone(493.88, 493.88, .92, .017, "triangle", .24, .06);
      return;
    }
    if (kind === "answer") {
      engine.tone(261.63, 261.63, .75, .028, "sine", 0, .04);
      engine.tone(392.0, 392.0, .72, .02, "sine", .08, .04);
      engine.tone(329.63, 329.63, .8, .018, "sine", .16, .045);
      return;
    }
    if (kind === "dusk") {
      engine.noise(.8, "lowpass", 420, 180, .9, .014);
      engine.tone(220.0, 220.0, 1.3, .024, "sine", .08, .12);
      engine.tone(329.63, 329.63, 1.2, .016, "sine", .18, .12);
      return;
    }
    if (kind === "depart") {
      for (let i = 0; i < 3; i++) {
        engine.noise(.04, "bandpass", 820 - i * 80, 440, 2.2, .016 - i * .004, i * .36);
      }
      engine.tone(293.66, 293.66, 1.4, .026, "sine", .12, .09);
      engine.tone(440.0, 440.0, 1.3, .018, "sine", .24, .09);
      engine.tone(587.33, 587.33, 1.25, .012, "sine", .38, .09);
      return;
    }
    if (kind === "table") {
      engine.tone(107, 34, .22, .22, "triangle");
      engine.noise(.14, "lowpass", 360, 85, 1.1, .14);
      engine.noise(.15, "bandpass", 680, 310, 1.4, .055, .07);
      engine.tone(70, 40, .12, .08, "sawtooth", .095);
      engine.tone(940, 860, .15, .026, "triangle", .11);
      engine.tone(1390, 1260, .13, .02, "sine", .14);
      [1746, 2310, 1484, 2620, 1832, 2190, 1560].forEach((f, i) =>
        engine.tone(f, f * .83, .16, .048 - i * .004, "sine", .07 + i * .046));
      return;
    }
    engine.tone(138, 46, .17, .17, "triangle");
    engine.noise(.11, "bandpass", 560, 240, 1.4, .09);
    for (let i = 0; i < 4; i++) {
      engine.noise(.075, "bandpass", 1320 - i * 110, 460, 1.6, .042 - i * .006, .07 + i * .078);
    }
    engine.tone(480, 610, .18, .024, "sine", .11);
    engine.tone(560, 470, .2, .02, "sine", .24);
  }

  function updateAmbiance(stalls: number, barred: boolean, tables: number, seats: number) {
    const wasOpen = remainingStalls > 0 || !passageBarred;
    remainingStalls = stalls;
    passageBarred = barred;
    tablesLeft = tables;
    seatsLeft = seats;
    engine.setAmbientTarget(targetAmbientGain());
    if (wasOpen && stalls === 0 && barred) {
      engine.tone(293.66, 293.66, 1.1, .024, "sine", .22, .09);
      engine.tone(440, 440, 1.0, .016, "sine", .28, .09);
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
