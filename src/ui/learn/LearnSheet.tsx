import { useState } from 'react';
import { hasOpenCase } from '../../game/detective';
import type { LabView } from '../../i18n/learn';
import { useAppStore } from '../../store/useAppStore';
import { Sheet } from '../components/Sheet';
import { BodyView } from './BodyView';
import { BudgetView } from './BudgetView';
import { DetectiveView } from './DetectiveView';
import { ExperimentsView } from './ExperimentsView';
import { FoodView } from './FoodView';
import { LifeView } from './LifeView';
import { ReportView } from './ReportView';
import { useLearn } from './useLearn';
import { WildView } from './WildView';

const TILES: { id: LabView; icon: string; tint: string }[] = [
  { id: 'wild', icon: '🌍', tint: 'bg-sky-50' },
  { id: 'life', icon: '⏳', tint: 'bg-amber-50' },
  { id: 'body', icon: '🫀', tint: 'bg-rose-50' },
  { id: 'food', icon: '🥗', tint: 'bg-emerald-50' },
  { id: 'detective', icon: '🔍', tint: 'bg-indigo-50' },
  { id: 'experiments', icon: '🧪', tint: 'bg-violet-50' },
  { id: 'budget', icon: '💸', tint: 'bg-pink-50' },
  { id: 'report', icon: '📋', tint: 'bg-yellow-50' },
];

/** Learning lab hub (lazy-loaded): eight small learning activities built on the care loop. */
export default function LearnSheet({
  onClose,
  initial = null,
}: {
  onClose: () => void;
  initial?: LabView | null;
}) {
  const { L, t } = useLearn();
  const pet = useAppStore((s) => s.game.pet);
  const experiment = useAppStore((s) => s.game.experiment);
  const budget = useAppStore((s) => s.game.budget);
  const [view, setView] = useState<LabView | null>(initial);
  if (!pet) return null;

  const badge: Partial<Record<LabView, boolean>> = {
    detective: hasOpenCase(pet),
    experiments: experiment !== null,
    budget: budget !== null,
  };
  const title = view
    ? `${TILES.find((x) => x.id === view)!.icon} ${L.lab.tiles[view].title}`
    : `🔬 ${L.lab.title}`;

  return (
    <Sheet title={title} onClose={onClose} full>
      {view && (
        <button
          type="button"
          onClick={() => setView(null)}
          className="mb-2 min-h-11 rounded-full bg-ink/5 px-4 text-sm font-bold text-ink active:scale-95"
        >
          ← {t('common.back')}
        </button>
      )}
      {view === null && (
        <>
          <p className="mb-3 text-sm text-ink/70">{L.lab.intro}</p>
          <ul className="grid grid-cols-2 gap-2 pb-3">
            {TILES.map((tile) => (
              <li key={tile.id}>
                <button
                  type="button"
                  onClick={() => setView(tile.id)}
                  className={`relative flex min-h-24 w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2 text-center ${tile.tint} active:scale-95`}
                >
                  <span className="text-3xl" aria-hidden="true">
                    {tile.icon}
                  </span>
                  <span className="font-black text-ink">{L.lab.tiles[tile.id].title}</span>
                  <span className="text-xs font-semibold text-ink/60">
                    {L.lab.tiles[tile.id].desc}
                  </span>
                  {badge[tile.id] && (
                    <span
                      className="absolute top-2 right-2 size-3 rounded-full bg-candy-pink"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {view === 'wild' && <WildView initial={pet.species} />}
      {view === 'life' && <LifeView pet={pet} />}
      {view === 'body' && <BodyView />}
      {view === 'food' && <FoodView />}
      {view === 'detective' && <DetectiveView pet={pet} />}
      {view === 'experiments' && <ExperimentsView />}
      {view === 'budget' && <BudgetView />}
      {view === 'report' && <ReportView pet={pet} />}
    </Sheet>
  );
}
