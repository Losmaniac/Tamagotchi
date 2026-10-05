import { useState } from 'react';
import { sfx } from '../../audio/synth';
import { EXPERIMENT_DAYS } from '../../game/constants';
import {
  EXPERIMENTS,
  EXPERIMENT_IDS,
  canStartExperiment,
  evaluate,
  isFinished,
  testDayNumber,
  type Conclusion,
  type Measurement,
} from '../../game/experiments';
import { localDayKey } from '../../game/game';
import { useAppStore } from '../../store/useAppStore';
import { useNow } from '../hooks';
import { Card, H3, PrimaryButton, SecondaryButton } from './shared';
import { useLearn } from './useLearn';

const CONCLUSIONS: Conclusion[] = ['supported', 'notSupported', 'unclear', 'unfair'];

function Bars({ before, after }: { before: Measurement; after: Measurement }) {
  const { L, n } = useLearn();
  const E = L.experiments;
  const bar = (label: string, m: Measurement, color: string) => (
    <div className="flex flex-1 flex-col items-center">
      <div className="flex h-28 w-14 items-end overflow-hidden rounded-xl bg-ink/5">
        <div
          className="w-full rounded-xl"
          style={{ height: `${Math.max(4, m.metric ?? 0)}%`, background: color }}
        />
      </div>
      <span className="mt-1 text-lg font-black text-ink">
        {m.metric === null ? E.noData : n(Math.round(m.metric))}
      </span>
      <span className="text-xs font-bold text-ink/60">{label}</span>
      <span className="text-[11px] text-ink/50">
        {E.changed}: {n(Math.round(m.variable * 10) / 10)}
      </span>
    </div>
  );
  return (
    <div className="flex gap-3" role="group">
      {bar(E.before, before, '#c4b5fd')}
      {bar(E.after, after, '#7c3aed')}
    </div>
  );
}

/** Care experiments: hypothesis → baseline → change one thing → compare → conclude. */
export function ExperimentsView() {
  const { L, tp, f } = useLearn();
  const E = L.experiments;
  const exp = useAppStore((s) => s.game.experiment);
  const diary = useAppStore((s) => s.game.diary);
  const start = useAppStore((s) => s.startExperiment);
  const cancel = useAppStore((s) => s.cancelExperiment);
  const conclude = useAppStore((s) => s.concludeExperiment);
  const now = useNow(60_000);
  const today = localDayKey(now);
  const [done, setDone] = useState<{
    picked: Conclusion;
    expected: Conclusion;
    coins: number;
  } | null>(null);

  if (done) {
    return (
      <div className="space-y-3 pb-3" role="status">
        <Card tint={done.picked === done.expected ? 'bg-emerald-50' : 'bg-amber-50'}>
          <H3>
            {done.picked === done.expected ? '✅' : '🤔'}{' '}
            {f(E.done, { answer: E.conclusions[done.expected].label })}
          </H3>
          <p className="mt-1 text-sm text-ink">{E.conclusions[done.expected].feedback}</p>
          <p className="mt-2 text-sm text-ink/70">{E.sample}</p>
          <p className="mt-2 font-black text-candy-purple">{f(E.reward, { coins: done.coins })}</p>
        </Card>
        <SecondaryButton onClick={() => setDone(null)}>
          {L.lab.tiles.experiments.title}
        </SecondaryButton>
      </div>
    );
  }

  if (exp) {
    const def = EXPERIMENTS[exp.id];
    const finished = isFinished(exp, today);
    const result = evaluate(exp, diary);
    return (
      <div className="space-y-3 pb-3">
        <Card tint="bg-violet-50">
          <p className="text-xs font-black tracking-wide text-ink/50 uppercase">
            {def.icon} {E.metric[def.metric]}
          </p>
          <H3>“{E.defs[exp.id].hypothesis}”</H3>
          {!finished && (
            <>
              <p className="mt-2 text-sm font-bold text-candy-purple">
                {f(E.running, { day: testDayNumber(exp, today), total: EXPERIMENT_DAYS })}
              </p>
              <p className="mt-1 text-sm text-ink">
                <span className="font-black">{E.doThis}</span> {E.defs[exp.id].change}
              </p>
            </>
          )}
        </Card>
        <Card tint="bg-white ring-1 ring-ink/10">
          <Bars before={result.before} after={result.after} />
        </Card>
        {finished ? (
          <Card tint="bg-amber-50">
            <H3>{E.question}</H3>
            <div className="mt-2 grid gap-2">
              {CONCLUSIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    const r = conclude(c);
                    if (!r) return;
                    sfx.coin();
                    setDone({ picked: c, expected: r.expected, coins: r.coins });
                  }}
                  className="min-h-12 rounded-xl bg-white px-3 font-black text-ink shadow active:scale-95"
                >
                  {E.conclusions[c].label}
                </button>
              ))}
            </div>
          </Card>
        ) : (
          <SecondaryButton onClick={cancel}>{E.cancel}</SecondaryButton>
        )}
      </div>
    );
  }

  const ready = canStartExperiment(diary, today);
  return (
    <div className="space-y-3 pb-3">
      <p className="text-sm text-ink/70">{E.intro}</p>
      <Card tint="bg-amber-50">
        <ul className="space-y-1 text-sm text-ink">
          {E.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </Card>
      {!ready && (
        <Card tint="bg-sky-50">
          <p className="text-sm font-semibold text-ink">ℹ️ {E.needBaseline}</p>
        </Card>
      )}
      <ul className="space-y-2">
        {EXPERIMENT_IDS.map((id) => (
          <li key={id} className="rounded-2xl bg-violet-50 p-3">
            <p className="text-xs font-black tracking-wide text-ink/50 uppercase">
              {EXPERIMENTS[id].icon} {E.metric[EXPERIMENTS[id].metric]} ·{' '}
              {tp('count.daysNom', EXPERIMENT_DAYS)}
            </p>
            <p className="font-black text-ink">“{E.defs[id].hypothesis}”</p>
            <div className="mt-2">
              <PrimaryButton disabled={!ready} onClick={() => start(id)}>
                🧪 {E.start}
              </PrimaryButton>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
