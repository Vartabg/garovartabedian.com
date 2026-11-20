export type CourtSound = ReturnType<typeof makeCourtSound>;

export function makeCourtSound() {
  let audio: AudioContext | undefined;
  let enabled = true;
  function unlock() {
    const Audio = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!enabled || !Audio) return;
    try {
      audio ??= new Audio();
      if (audio.state === "suspended") void audio.resume().catch(() => { });
    } catch { /* The court is also playable in silence. */ }
  }
  function tone(frequency: number, end: number, duration: number, level: number, wave: OscillatorType, delay = 0) {
    if (!audio || !enabled || audio.state === "closed") return;
    const now = audio.currentTime + delay, osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(frequency, now); osc.frequency.exponentialRampToValueAtTime(end, now + duration);
    gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(level, now + .006);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain); gain.connect(audio.destination);
    osc.start(now); osc.stop(now + duration + .02);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  function play(kind: "table" | "seat" | "gate" | "air") {
    if (kind === "air") { tone(135, 55, .1, .075, "triangle"); return; }
    if (kind === "gate") { tone(190, 115, .2, .1, "triangle"); tone(310, 260, .26, .045, "sine", .1); return; }
    tone(107, 34, .22, .22, "triangle");
    tone(70, 40, .12, .09, "sawtooth", .095);
    if (kind === "table") {
      [1746, 2310, 1484, 2620, 1832, 2190, 1560].forEach((f, i) => tone(f, f * .83, .16, .05 - i * .004, "sine", .07 + i * .046));
    } else {
      for (let i = 0; i < 3; i++) tone(420 + i * 120, 120, .07, .035, "triangle", .1 + i * .09);
    }
  }
  return {
    unlock, play, setEnabled(value: boolean) { enabled = value; if (value) unlock(); },
    close() { if (audio && audio.state !== "closed") void audio.close().catch(() => { }); }
  };
}
