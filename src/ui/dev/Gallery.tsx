import { useMemo, useState } from 'react';
import { SPECIES, STAGES, type ColorVariant, type Form, type Stage } from '../../game/types';
import type { Mood } from '../../game/status';
import { ParticleLayer, ParticleSystem } from '../../three/Particles';
import { PetCanvas } from '../../three/PetCanvas';
import { PetStage } from '../../three/PetStage';

const MOODS: Mood[] = [
  'content',
  'happy',
  'sad',
  'sick',
  'sleeping',
  'grumpy',
  'dirty',
  'critical',
];

/** Debug-only model gallery (?gallery=1): every species side by side. */
export default function Gallery() {
  const params = new URLSearchParams(location.search);
  const [stage, setStage] = useState<Stage>((params.get('stage') as Stage) ?? 'teen');
  const [mood, setMood] = useState<Mood>((params.get('mood') as Mood) ?? 'content');
  const [color, setColor] = useState<ColorVariant>(
    Number(params.get('color') ?? 0) as ColorVariant,
  );
  const [form, setForm] = useState<Form>((params.get('form') as Form) ?? 'normal');
  const particles = useMemo(() => new ParticleSystem(), []);
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-pink-100 to-violet-200">
      <div className="flex flex-wrap gap-1 p-2 text-xs">
        {STAGES.map((s) => (
          <button
            key={s}
            className={`rounded px-2 py-1 ${s === stage ? 'bg-pink-400 text-white' : 'bg-white'}`}
            onClick={() => setStage(s)}
          >
            {s}
          </button>
        ))}
        {MOODS.map((m) => (
          <button
            key={m}
            className={`rounded px-2 py-1 ${m === mood ? 'bg-violet-500 text-white' : 'bg-white'}`}
            onClick={() => setMood(m)}
          >
            {m}
          </button>
        ))}
        {([0, 1, 2] as const).map((c) => (
          <button
            key={c}
            className={`rounded px-2 py-1 ${c === color ? 'bg-sky-500 text-white' : 'bg-white'}`}
            onClick={() => setColor(c)}
          >
            color {c}
          </button>
        ))}
        {(['normal', 'star', 'grumpy'] as const).map((f) => (
          <button
            key={f}
            className={`rounded px-2 py-1 ${f === form ? 'bg-amber-500 text-white' : 'bg-white'}`}
            onClick={() => setForm(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <PetCanvas className="flex-1" lowPower={params.has('low')} cameraZ={13}>
        {SPECIES.map((species, i) => (
          <group
            key={species}
            position={[((i % 4) - 1.5) * 1.65, 2.1 - Math.floor(i / 4) * 2.05, 0]}
          >
            <PetStage
              look={{ species, color, stage, form }}
              mood={mood}
              particles={particles}
              equipped={
                params.get('acc')
                  ? { hat: 'partyHat', glasses: 'roundGlasses', scarf: 'redScarf' }
                  : {}
              }
              eggProgress={0.7}
            />
          </group>
        ))}
        <ParticleLayer system={particles} />
      </PetCanvas>
    </div>
  );
}
