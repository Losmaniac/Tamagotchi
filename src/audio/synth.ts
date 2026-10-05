// Tiny Web Audio synth: every sound effect is generated, no audio files.
// The context is created lazily on the first user gesture (autoplay policies).

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

type Wave = OscillatorType;

interface Tone {
  freq: number;
  dur: number;
  type?: Wave;
  gain?: number;
  /** Glide to this frequency over the tone. */
  to?: number;
  delay?: number;
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    try {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    } catch {
      ctx = null;
    }
  }
  return ctx;
}

/** Call from a user gesture handler to allow sound on iOS/Android. */
export function unlockAudio(): void {
  const c = getContext();
  if (c && c.state === 'suspended') void c.resume().catch(() => undefined);
}

function tone({ freq, dur, type = 'sine', gain = 0.6, to, delay = 0 }: Tone): void {
  const c = ctx;
  if (!enabled || !c || !master || c.state !== 'running') return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const seq = (tones: Tone[]) => () => tones.forEach(tone);

export const sfx = {
  poke: seq([{ freq: 520, to: 780, dur: 0.09, type: 'triangle' }]),
  stroke: seq([
    { freq: 660, dur: 0.12, type: 'sine', gain: 0.4 },
    { freq: 880, dur: 0.16, type: 'sine', gain: 0.4, delay: 0.1 },
  ]),
  eat: seq([
    { freq: 300, to: 220, dur: 0.07, type: 'square', gain: 0.25 },
    { freq: 300, to: 220, dur: 0.07, type: 'square', gain: 0.25, delay: 0.14 },
    { freq: 300, to: 220, dur: 0.07, type: 'square', gain: 0.25, delay: 0.28 },
  ]),
  happy: seq([
    { freq: 523, dur: 0.1, type: 'triangle' },
    { freq: 659, dur: 0.1, type: 'triangle', delay: 0.09 },
    { freq: 784, dur: 0.16, type: 'triangle', delay: 0.18 },
  ]),
  clean: seq(
    Array.from({ length: 5 }, (_, i) => ({
      freq: 900 + i * 180,
      to: 1400 + i * 180,
      dur: 0.06,
      type: 'sine' as Wave,
      gain: 0.25,
      delay: i * 0.06,
    })),
  ),
  medicine: seq([
    { freq: 440, to: 660, dur: 0.15, type: 'sine' },
    { freq: 660, to: 990, dur: 0.2, type: 'sine', delay: 0.12 },
  ]),
  no: seq([
    { freq: 220, dur: 0.12, type: 'square', gain: 0.25 },
    { freq: 180, dur: 0.18, type: 'square', gain: 0.25, delay: 0.12 },
  ]),
  scold: seq([{ freq: 330, to: 160, dur: 0.25, type: 'sawtooth', gain: 0.25 }]),
  lights: seq([{ freq: 1200, dur: 0.04, type: 'square', gain: 0.2 }]),
  coin: seq([
    { freq: 988, dur: 0.08, type: 'square', gain: 0.22 },
    { freq: 1319, dur: 0.22, type: 'square', gain: 0.22, delay: 0.08 },
  ]),
  levelUp: seq(
    [523, 659, 784, 1047].map((f, i) => ({
      freq: f,
      dur: 0.14,
      type: 'triangle' as Wave,
      delay: i * 0.1,
    })),
  ),
  alert: seq([
    { freq: 880, dur: 0.1, type: 'square', gain: 0.2 },
    { freq: 880, dur: 0.1, type: 'square', gain: 0.2, delay: 0.18 },
  ]),
  tick: seq([{ freq: 1500, dur: 0.03, type: 'square', gain: 0.18 }]),
  beat: seq([{ freq: 180, to: 60, dur: 0.12, type: 'sine', gain: 0.8 }]),
  perfect: seq([{ freq: 1047, dur: 0.1, type: 'triangle', gain: 0.4 }]),
  good: seq([{ freq: 784, dur: 0.08, type: 'triangle', gain: 0.35 }]),
  miss: seq([{ freq: 160, dur: 0.12, type: 'sawtooth', gain: 0.2 }]),
  yawn: seq([{ freq: 520, to: 260, dur: 0.7, type: 'sine', gain: 0.25 }]),
  sad: seq([
    { freq: 440, to: 392, dur: 0.3, type: 'sine', gain: 0.35 },
    { freq: 349, to: 330, dur: 0.5, type: 'sine', gain: 0.35, delay: 0.3 },
  ]),
};

export type SfxName = keyof typeof sfx;

// --- Species voices ------------------------------------------------------------------------

const VOICES: Record<string, Tone[]> = {
  cat: [
    { freq: 620, to: 880, dur: 0.12, type: 'sine', gain: 0.35 },
    { freq: 880, to: 520, dur: 0.22, type: 'sine', gain: 0.35, delay: 0.11 },
  ],
  dog: [
    { freq: 300, to: 180, dur: 0.1, type: 'square', gain: 0.22 },
    { freq: 320, to: 190, dur: 0.12, type: 'square', gain: 0.22, delay: 0.16 },
  ],
  bunny: [
    { freq: 1400, to: 1900, dur: 0.06, type: 'sine', gain: 0.25 },
    { freq: 1500, to: 2000, dur: 0.06, type: 'sine', gain: 0.25, delay: 0.09 },
  ],
  fox: [{ freq: 700, to: 1200, dur: 0.14, type: 'triangle', gain: 0.3 }],
  panda: [{ freq: 220, to: 260, dur: 0.3, type: 'sine', gain: 0.4 }],
  dragon: [{ freq: 160, to: 110, dur: 0.35, type: 'sawtooth', gain: 0.18 }],
};

export function voice(species: string): void {
  (VOICES[species] ?? VOICES.cat!).forEach(tone);
}

// --- Generative background music -------------------------------------------------------------

const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16];
let musicTimer: number | null = null;
let step = 0;
let note = 3;

/** Soft pentatonic random walk; slower and lower at night. */
export function startMusic(isNight: () => boolean): void {
  if (musicTimer !== null) return;
  const tick = () => {
    const night = isNight();
    const root = night ? 196 : 262; // G3 at night, C4 by day
    const c = ctx;
    if (enabled && c && c.state === 'running') {
      note = Math.max(
        0,
        Math.min(PENTATONIC.length - 1, note + Math.round((Math.random() - 0.5) * 3)),
      );
      if (Math.random() < 0.7) {
        tone({
          freq: root * 2 ** (PENTATONIC[note]! / 12),
          dur: night ? 1.1 : 0.6,
          type: 'triangle',
          gain: 0.07,
        });
      }
      if (step % 4 === 0)
        tone({ freq: root / 2, dur: night ? 2.2 : 1.4, type: 'sine', gain: 0.06 });
    }
    step++;
    musicTimer = window.setTimeout(tick, night ? 750 : 420);
  };
  tick();
}

export function stopMusic(): void {
  if (musicTimer !== null) window.clearTimeout(musicTimer);
  musicTimer = null;
}
