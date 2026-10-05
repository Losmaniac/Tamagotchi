import { localDayKey } from '../../game/game';
import { MOOD_ICON } from '../../game/learning';
import { reportCard, type Grade } from '../../game/report';
import type { Pet } from '../../game/types';
import { useAppStore } from '../../store/useAppStore';
import { useNow } from '../hooks';
import { Card, H3 } from './shared';
import { useLearn } from './useLearn';

const GRADE_STYLE: Record<Grade, string> = {
  A: 'bg-emerald-500 text-white',
  B: 'bg-sky-500 text-white',
  C: 'bg-amber-400 text-ink',
  D: 'bg-rose-500 text-white',
};

function GradeBadge({ grade, label }: { grade: Grade; label: string }) {
  return (
    <span
      className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-xl font-black ${GRADE_STYLE[grade]}`}
      aria-label={`${grade} — ${label}`}
    >
      {grade}
    </span>
  );
}

/** Weekly responsibility report card, with a real-life care tip for the species. */
export function ReportView({ pet }: { pet: Pet }) {
  const { L, f, locale } = useLearn();
  const R = L.report;
  const diary = useAppStore((s) => s.game.diary);
  const moods = useAppStore((s) => s.game.progress.moods);
  const now = useNow(60_000);
  const card = reportCard(diary, localDayKey(now));
  const week = Math.floor(now / (7 * 86_400_000));
  const tip = R.tips[pet.species][week % 2]!;
  const date = new Intl.DateTimeFormat(locale, { weekday: 'short' });

  return (
    <div className="space-y-3 pb-3">
      <p className="text-sm text-ink/70">{R.intro}</p>
      {card.days === 0 ? (
        <Card tint="bg-ink/5">
          <p className="text-sm text-ink/70">{R.empty}</p>
        </Card>
      ) : (
        <>
          <Card tint="bg-violet-50">
            <div className="flex items-center gap-3">
              <GradeBadge grade={card.overall} label={R.gradeText[card.overall]} />
              <div>
                <H3>{R.overall}</H3>
                <p className="text-sm font-bold text-ink/70">{R.gradeText[card.overall]}</p>
              </div>
            </div>
          </Card>
          <ul className="space-y-2">
            {card.lines.map((line) => (
              <li
                key={line.category}
                className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink/10"
              >
                <GradeBadge grade={line.grade} label={R.gradeText[line.grade]} />
                <div>
                  <p className="font-black text-ink">{R.categories[line.category].label}</p>
                  <p className="text-sm text-ink/70">
                    {f(R.categories[line.category].detail, { value: line.value })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {moods.length > 0 && (
        <Card tint="bg-amber-50">
          <H3>{L.checkin.history}</H3>
          <ul className="mt-1 flex flex-wrap gap-2">
            {moods.slice(-7).map((m) => {
              const [y, mo, d] = m.day.split('-').map(Number);
              return (
                <li
                  key={m.day}
                  className="flex flex-col items-center text-xs font-bold text-ink/70"
                >
                  <span className="text-2xl" role="img" aria-label={L.checkin.moods[m.mood]}>
                    {MOOD_ICON[m.mood]}
                  </span>
                  {date.format(new Date(y!, (mo ?? 1) - 1, d))}
                </li>
              );
            })}
          </ul>
          <p className="mt-1 text-xs text-ink/50">{L.checkin.privacy}</p>
        </Card>
      )}
      <Card tint="bg-emerald-50">
        <H3>🐾 {R.tipTitle}</H3>
        <p className="mt-1 text-sm text-ink">{tip}</p>
      </Card>
    </div>
  );
}
