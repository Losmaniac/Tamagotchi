import type { StatKey } from '../../game/types';
import { useAppStore } from '../../store/useAppStore';
import { Sheet } from '../components/Sheet';

const STATS: StatKey[] = ['hunger', 'happiness', 'energy', 'hygiene', 'health'];
const SCALES = [1, 60, 3600];

/** Hidden developer panel (?debug=1). English only on purpose. */
export function DebugPanel({ onClose }: { onClose: () => void }) {
  const pet = useAppStore((s) => s.game.pet);
  const scale = useAppStore((s) => s.debugTimeScale);
  const offset = useAppStore((s) => s.debugOffset);
  const debug = useAppStore((s) => s.debug);
  const resetGame = useAppStore((s) => s.resetGame);
  const btn = 'min-h-12 rounded-xl bg-ink/5 px-3 font-bold text-ink active:scale-95';
  return (
    <Sheet title="🐞 Debug" onClose={onClose} full>
      <p className="text-sm text-ink/60">Clock offset: {(offset / 3_600_000).toFixed(2)} h</p>
      <h3 className="mt-3 font-black">Time multiplier</h3>
      <div className="mt-1 grid grid-cols-3 gap-2">
        {SCALES.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={scale === s}
            onClick={() => debug.setTimeScale(s)}
            className={`${btn} ${scale === s ? 'bg-candy-pink text-white' : ''}`}
          >
            {s.toLocaleString('cs-CZ')}×
          </button>
        ))}
      </div>
      {pet && (
        <>
          <h3 className="mt-4 font-black">Stats</h3>
          {STATS.map((k) => (
            <label key={k} className="flex items-center gap-3 py-1">
              <span className="w-24 text-sm font-bold">{k}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(pet.stats[k])}
                onChange={(e) => debug.setStat(k, Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-8 text-right text-sm">{Math.round(pet.stats[k])}</span>
            </label>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" className={btn} onClick={debug.forceSick}>
              Force sickness
            </button>
            <button type="button" className={btn} onClick={debug.skipStage}>
              Skip stage
            </button>
            <button type="button" className={btn} onClick={debug.kill}>
              Kill pet
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => {
                resetGame();
                onClose();
              }}
            >
              Clear save
            </button>
          </div>
          <pre className="mt-3 max-h-48 overflow-auto rounded-xl bg-ink/5 p-2 text-[10px]">
            {JSON.stringify(
              {
                stage: pet.stage,
                form: pet.form,
                asleep: pet.asleep,
                sick: pet.sick,
                poops: pet.poops,
                discipline: pet.discipline,
                actingUp: pet.actingUp,
                calls: pet.calls,
              },
              null,
              1,
            )}
          </pre>
        </>
      )}
    </Sheet>
  );
}
