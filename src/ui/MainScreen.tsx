import { lazy, Suspense, useCallback, useState } from 'react';
import type { MinigameId } from '../game/save';
import { useT } from '../i18n/useT';
import { useAppStore, type PetAction } from '../store/useAppStore';
import { AwaySummary } from './AwaySummary';
import { ActionBar, type ActionId } from './components/ActionBar';
import { StatBars } from './components/StatBars';
import { StatusBanner } from './components/StatusBanner';
import { AchievementToast, FeedbackToast, StorageWarning } from './components/Toasts';
import { DeathScreen } from './DeathScreen';
import { useGameLoop } from './hooks';
import { backgroundFor } from './background';
import { PetView } from './PetView';
import { AchievementsSheet } from './sheets/AchievementsSheet';
import { DebugPanel } from './sheets/DebugPanel';
import { FeedSheet } from './sheets/FeedSheet';
import { MemorialSheet } from './sheets/MemorialSheet';
import { PlaySheet } from './sheets/PlaySheet';
import { SettingsSheet } from './sheets/SettingsSheet';
import { StatsSheet } from './sheets/StatsSheet';

type SheetId =
  'feed' | 'play' | 'stats' | 'settings' | 'memorial' | 'achievements' | 'debug' | 'shop';

// Lazy-loaded: only fetched when opened.
const ShopSheet = lazy(() => import('./sheets/ShopSheet'));
const MinigameHost = lazy(() =>
  import('../minigames/MinigameHost').then((m) => ({ default: m.MinigameHost })),
);

const DEBUG = new URLSearchParams(location.search).get('debug') === '1';

export function MainScreen() {
  useGameLoop();
  const { t, n } = useT();
  const pet = useAppStore((s) => s.game.pet)!;
  const game = useAppStore((s) => s.game);
  const summary = useAppStore((s) => s.summary);
  const perform = useAppStore((s) => s.perform);
  const dismissSummary = useAppStore((s) => s.dismissSummary);
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const [playing, setPlaying] = useState<MinigameId | null>(null);
  const close = useCallback(() => setSheet(null), []);

  const onAction = useCallback((a: PetAction) => void perform(a), [perform]);

  if (pet.dead && !summary) {
    return (
      <>
        <DeathScreen pet={pet} onMemorial={() => setSheet('memorial')} />
        {sheet === 'memorial' && <MemorialSheet entries={game.memorial} onClose={close} />}
      </>
    );
  }

  const egg = pet.stage === 'egg';
  const calls = pet.calls;
  const onBar = (id: ActionId) => {
    switch (id) {
      case 'feed':
      case 'play':
      case 'stats':
        return setSheet(id);
      case 'clean':
        return onAction('clean');
      case 'lights':
        return onAction('lights');
      case 'medicine':
        return onAction('medicine');
    }
  };

  return (
    <main
      className="flex h-full flex-col transition-[background] duration-700"
      style={{
        background: backgroundFor(pet, game.inventory),
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <header className="flex items-center gap-2 px-3 pt-2 pb-2">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl leading-tight font-black text-ink">{pet.name}</h1>
          <p className="text-xs font-bold text-ink/60">
            {t(`stage.${pet.stage}`)}
            {pet.stage !== 'egg' && pet.form !== 'normal' ? ` · ${t(`form.${pet.form}`)}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSheet('shop')}
          className="flex h-12 items-center gap-1 rounded-full bg-white/75 px-3 font-black text-ink shadow-sm active:scale-95"
          aria-label={`${t('action.shop')} · ${t('coins.label')}: ${n(game.coins)}`}
        >
          <span aria-hidden="true">🪙</span>
          {n(game.coins)}
          <span aria-hidden="true" className="text-sm">
            🛍️
          </span>
        </button>
        {DEBUG && (
          <button
            type="button"
            onClick={() => setSheet('debug')}
            className="flex size-12 items-center justify-center rounded-full bg-white/75 text-xl shadow-sm"
            aria-label="Debug"
          >
            🐞
          </button>
        )}
        <button
          type="button"
          onClick={() => setSheet('settings')}
          className="flex size-12 items-center justify-center rounded-full bg-white/75 text-xl shadow-sm"
          aria-label={t('action.settings')}
        >
          ⚙️
        </button>
      </header>

      <StatBars stats={pet.stats} dim={egg} />
      <StorageWarning />
      <div className="mt-2">
        <StatusBanner pet={pet} onAction={onAction} />
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <PetView
          pet={pet}
          inventory={game.inventory}
          paused={(sheet !== null && sheet !== 'shop') || summary !== null || playing !== null}
          framing={sheet === 'shop' ? 'top' : 'center'}
          onAction={onAction}
        />
        <FeedbackToast />
      </div>

      <ActionBar
        onAction={onBar}
        lightsOn={pet.lightsOn}
        disabled={{ feed: egg, play: egg, clean: egg, lights: egg, medicine: egg }}
        highlight={{
          feed: !!calls.hunger,
          play: !!calls.happiness,
          clean: !!calls.hygiene || pet.poops > 0,
          lights: !!calls.lights,
          medicine: pet.sick,
        }}
      />

      {sheet === 'feed' && <FeedSheet onClose={close} onAction={onAction} />}
      {sheet === 'play' && (
        <PlaySheet
          pet={pet}
          onClose={close}
          onAction={onAction}
          onGame={(id) => {
            setSheet(null);
            setPlaying(id);
          }}
        />
      )}
      {sheet === 'stats' && <StatsSheet pet={pet} log={game.log} onClose={close} />}
      {sheet === 'settings' && <SettingsSheet onClose={close} onOpen={(s) => setSheet(s)} />}
      {sheet === 'memorial' && <MemorialSheet entries={game.memorial} onClose={close} />}
      {sheet === 'achievements' && <AchievementsSheet onClose={close} />}
      {sheet === 'debug' && <DebugPanel onClose={close} />}
      <Suspense>
        {sheet === 'shop' && <ShopSheet onClose={close} />}
        {playing && (
          <MinigameHost
            id={playing}
            species={pet.species}
            name={pet.name}
            onClose={() => setPlaying(null)}
          />
        )}
      </Suspense>
      {summary && <AwaySummary summary={summary} name={pet.name} onClose={dismissSummary} />}
      <AchievementToast />
    </main>
  );
}
