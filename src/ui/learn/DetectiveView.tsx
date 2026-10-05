import { useState } from 'react';
import { sfx } from '../../audio/synth';
import { clueList, hasOpenCase } from '../../game/detective';
import { SICK_CAUSES, type Pet, type SickCause } from '../../game/types';
import { useAppStore } from '../../store/useAppStore';
import { Card, H3 } from './shared';
import { useLearn } from './useLearn';

const CAUSE_ICON: Record<SickCause, string> = {
  dirty: '💩',
  hungry: '🍽️',
  overfed: '🍪',
  bug: '🦠',
};

/** Detective mode: study the clues recorded when the pet got sick and name the cause. */
export function DetectiveView({ pet }: { pet: Pet }) {
  const { L, n, f } = useLearn();
  const D = L.detective;
  const solveCase = useAppStore((s) => s.solveCase);
  const progress = useAppStore((s) => s.game.progress);
  const [result, setResult] = useState<{
    correct: boolean;
    answer: SickCause;
    coins: number;
    guess: SickCause;
  } | null>(null);
  const open = hasOpenCase(pet);
  const clues = pet.sickClues;

  return (
    <div className="space-y-3 pb-3">
      <p className="text-sm text-ink/70">{D.intro}</p>
      <Card tint="bg-amber-50">
        <ol className="space-y-1 text-sm text-ink">
          {D.howTo.map((s, i) => (
            <li key={i}>
              {n(i + 1)}. {s}
            </li>
          ))}
        </ol>
      </Card>

      {(open || result) && clues ? (
        <Card tint="bg-sky-50">
          <H3>🔍 {f(D.caseTitle, { name: pet.name })}</H3>
          <ul className="mt-2 grid grid-cols-2 gap-2">
            {clueList(clues).map((c) => (
              <li
                key={c.key}
                className={`rounded-xl bg-white p-2 ${result && c.suspicious ? 'ring-2 ring-rose-500' : ''}`}
              >
                <span className="block text-xs font-bold text-ink/60">{D.clues[c.key]}</span>
                <span className="text-xl font-black text-ink">{n(c.value)}</span>
                {c.key === 'hygiene' || c.key === 'hunger' || c.key === 'energy' ? (
                  <span className="text-xs text-ink/50"> / {n(100)}</span>
                ) : null}
                {result && c.suspicious && (
                  <span className="block text-xs font-black text-rose-700">{D.suspicious}</span>
                )}
              </li>
            ))}
          </ul>
          {!result ? (
            <>
              <p className="mt-3 font-black text-ink">{D.question}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {SICK_CAUSES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      const r = solveCase(c);
                      if (!r) return;
                      if (r.correct) sfx.perfect();
                      else sfx.no();
                      setResult({ ...r, guess: c });
                    }}
                    className="flex min-h-14 items-center justify-center gap-1 rounded-xl bg-white font-black text-ink shadow active:scale-95"
                  >
                    <span aria-hidden="true">{CAUSE_ICON[c]}</span> {D.causes[c].label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div role="status" className="mt-3 rounded-xl bg-white p-3">
              <p
                className={`text-lg font-black ${result.correct ? 'text-emerald-700' : 'text-rose-700'}`}
              >
                {result.correct
                  ? `✅ ${f(D.right, { coins: result.coins })}`
                  : `❌ ${f(D.wrong, { answer: D.causes[result.answer].label })}`}
              </p>
              <p className="mt-1 text-sm text-ink">{D.causes[result.answer].explain}</p>
              {pet.sick && <p className="mt-2 text-sm font-bold text-ink">💊 {D.medicine}</p>}
            </div>
          )}
        </Card>
      ) : (
        <Card tint="bg-ink/5">
          <p className="text-sm font-semibold text-ink/70">{D.noCase}</p>
        </Card>
      )}
      <p className="text-xs text-ink/60">
        {f(D.stats, { solved: progress.casesSolved, correct: progress.casesCorrect })}
      </p>
    </div>
  );
}
