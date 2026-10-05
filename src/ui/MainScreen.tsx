import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { sfx } from '../audio/synth';
import type { MinigameId } from '../game/save';
import { localMinutes } from '../game/sleep';
import type { MemorialEntry } from '../game/types';
import { skyPhase } from '../game/world';
import { useT } from '../i18n/useT';
import { InstallBanner, InstallSetting } from '../pwa/PwaBanners';
import { withChunkReload } from '../pwa/registerSW';
import { useAppStore, type PetAction } from '../store/useAppStore';
import { SPECIES_THEMES } from '../three/palette';
import type { CaptureFn } from '../three/PetCanvas';
import { addPhoto, type Photo, type PhotoKind } from './album';
import { AwaySummary } from './AwaySummary';
import { ActionBar, type ActionId } from './components/ActionBar';
import { BreakReminder } from './components/BreakReminder';
import { FactCard } from './components/FactCard';
import { JoyToast } from './components/Joy';
import { Sheet } from './components/Sheet';
import { StatBars } from './components/StatBars';
import { StatusBanner } from './components/StatusBanner';
import { AchievementToast, FeedbackToast, StorageWarning } from './components/Toasts';
import { DeathScreen } from './DeathScreen';
import { useGameLoop, useNow } from './hooks';
import { framePhoto, dataUrlToFile, shareOrDownload } from './photo';
import { PetView } from './PetView';
import { AchievementsSheet } from './sheets/AchievementsSheet';
import { AlbumSheet } from './sheets/AlbumSheet';
import { BankSheet } from './sheets/BankSheet';
import { DebugPanel } from './sheets/DebugPanel';
import { DiarySheet } from './sheets/DiarySheet';
import { EncyclopediaSheet } from './sheets/EncyclopediaSheet';
import { FeedSheet } from './sheets/FeedSheet';
import { MemorialSheet } from './sheets/MemorialSheet';
import { MenuSheet, type HubTarget } from './sheets/MenuSheet';
import { PlaySheet } from './sheets/PlaySheet';
import { SettingsSheet } from './sheets/SettingsSheet';
import { StatsSheet } from './sheets/StatsSheet';
import { skyGradient } from './sky';
import { usePhotoCaption } from './usePhotoCaption';
import { useTodaysFact } from './useTodaysFact';

type SheetId = 'feed' | 'play' | 'stats' | 'menu' | 'debug' | 'shop' | 'photo' | HubTarget;

// Lazy-loaded: only fetched when opened.
const ShopSheet = lazy(withChunkReload(() => import('./sheets/ShopSheet')));
const MinigameHost = lazy(
  withChunkReload(() =>
    import('../minigames/MinigameHost').then((m) => ({ default: m.MinigameHost })),
  ),
);

const DEBUG = new URLSearchParams(location.search).get('debug') === '1';

function HeaderButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/75 text-xl shadow-sm active:scale-95"
      aria-label={label}
    >
      {icon}
    </button>
  );
}

export function MainScreen() {
  useGameLoop();
  const { t, n, locale } = useT();
  const pet = useAppStore((s) => s.game.pet)!;
  const game = useAppStore((s) => s.game);
  const summary = useAppStore((s) => s.summary);
  const reaction = useAppStore((s) => s.reaction);
  const joy = useAppStore((s) => s.joy);
  const perform = useAppStore((s) => s.perform);
  const dismissSummary = useAppStore((s) => s.dismissSummary);
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const [playing, setPlaying] = useState<MinigameId | null>(null);
  const [factOpen, setFactOpen] = useState(false);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [memorialAlbum, setMemorialAlbum] = useState<MemorialEntry | null>(null);
  const capture = useRef<CaptureFn | null>(null);
  const caption = usePhotoCaption();
  const now = useNow(60_000);
  const factIndex = useTodaysFact(pet, now);
  const close = useCallback(() => setSheet(null), []);
  const onCaptureReady = useCallback((fn: CaptureFn | null) => {
    capture.current = fn;
  }, []);
  const onAction = useCallback((a: PetAction) => void perform(a), [perform]);

  /** Snapshot the canvas, frame it and store it in the album. */
  const takePhoto = useCallback(
    async (kind: PhotoKind, detail?: string): Promise<Photo | null> => {
      const snap = capture.current?.();
      const current = useAppStore.getState().game.pet;
      if (!snap || !current) return null;
      const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(Date.now());
      const image = await framePhoto({
        snapshot: snap,
        colors: SPECIES_THEMES[current.species].background,
        title: current.name,
        caption: `${caption({ kind, ...(detail ? { detail } : {}) })} · ${date}`,
      });
      const entry: Photo = {
        id: `${current.id}-${Date.now()}`,
        petId: current.id,
        petName: current.name,
        t: Date.now(),
        kind,
        ...(detail ? { detail } : {}),
        image,
      };
      await addPhoto(entry);
      return entry;
    },
    [caption, locale],
  );

  // Automatic album: hatching, growing up and birthdays.
  useEffect(() => {
    if (reaction?.kind !== 'evolve') return;
    const current = useAppStore.getState().game.pet;
    if (!current) return;
    const kind: PhotoKind =
      current.stage === 'baby' &&
      current.hatchedAt !== null &&
      Date.now() - current.hatchedAt < 15 * 60_000
        ? 'hatched'
        : 'evolved';
    const timer = window.setTimeout(() => void takePhoto(kind, current.stage), 1700);
    return () => window.clearTimeout(timer);
  }, [reaction, takePhoto]);
  useEffect(() => {
    if (joy?.kind !== 'birthday') return;
    const timer = window.setTimeout(() => void takePhoto('birthday', String(joy.days ?? 1)), 1500);
    return () => window.clearTimeout(timer);
  }, [joy, takePhoto]);

  const memorialSheets = (
    <>
      {sheet === 'memorial' && !memorialAlbum && (
        <MemorialSheet
          entries={game.memorial}
          onClose={close}
          onAlbum={(m) => setMemorialAlbum(m)}
        />
      )}
      {memorialAlbum && (
        <AlbumSheet
          petId={memorialAlbum.id}
          title={memorialAlbum.name}
          onClose={() => setMemorialAlbum(null)}
        />
      )}
    </>
  );

  if (pet.dead && !summary) {
    return (
      <>
        <DeathScreen pet={pet} onMemorial={() => setSheet('memorial')} />
        {memorialSheets}
      </>
    );
  }

  const egg = pet.stage === 'egg';
  const calls = pet.calls;
  const phase = skyPhase(localMinutes(now));
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
  const snap = async () => {
    sfx.tick();
    const p = await takePhoto('photo');
    if (p) {
      setPhoto(p);
      setSheet('photo');
    }
  };

  return (
    <main
      className="flex h-full flex-col transition-[background] duration-[2000ms]"
      style={{
        background: skyGradient(pet.species, game.inventory, phase),
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <header className="flex items-center gap-2 px-3 pt-2 pb-2">
        <div className="min-w-0 flex-1 rounded-2xl">
          <h1
            className={`truncate text-2xl leading-tight font-black ${phase === 'night' ? 'text-white' : 'text-ink'}`}
          >
            {pet.name}
          </h1>
          <p className={`text-xs font-bold ${phase === 'night' ? 'text-white/75' : 'text-ink/60'}`}>
            {t(`stage.${pet.stage}`)}
            {pet.stage !== 'egg' && pet.form !== 'normal' ? ` · ${t(`form.${pet.form}`)}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSheet('shop')}
          className="flex h-12 shrink-0 items-center gap-1 rounded-full bg-white/75 px-3 font-black text-ink shadow-sm active:scale-95"
          aria-label={`${t('action.shop')} · ${t('coins.label')}: ${n(game.coins)}`}
        >
          <span aria-hidden="true">🪙</span>
          {n(game.coins)}
        </button>
        {DEBUG && <HeaderButton label="Debug" icon="🐞" onClick={() => setSheet('debug')} />}
        {!egg && <HeaderButton label={t('action.photo')} icon="📷" onClick={() => void snap()} />}
        <HeaderButton label={t('action.menu')} icon="☰" onClick={() => setSheet('menu')} />
      </header>

      <StatBars stats={pet.stats} dim={egg} />
      <StorageWarning />
      {!egg && <InstallBanner />}
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
          onCaptureReady={onCaptureReady}
        />
        {factIndex !== null && !egg && (
          <button
            type="button"
            onClick={() => setFactOpen(true)}
            className="anim-pop absolute top-3 left-3 z-10 flex min-h-12 items-center gap-1 rounded-full bg-white/90 px-3 font-black text-ink shadow-md ring-2 ring-candy-yellow"
          >
            <span aria-hidden="true">💡</span> {t('fact.button')}
          </button>
        )}
        <JoyToast />
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
      {sheet === 'menu' && <MenuSheet onClose={close} onOpen={(target) => setSheet(target)} />}
      {sheet === 'settings' && (
        <SettingsSheet
          onClose={close}
          onOpen={(s) => setSheet(s)}
          installSlot={<InstallSetting />}
        />
      )}
      {memorialSheets}
      {sheet === 'achievements' && <AchievementsSheet onClose={close} />}
      {sheet === 'encyclopedia' && <EncyclopediaSheet onClose={close} />}
      {sheet === 'bank' && <BankSheet onClose={close} />}
      {sheet === 'diary' && <DiarySheet onClose={close} />}
      {sheet === 'album' && <AlbumSheet petId={pet.id} onClose={close} />}
      {sheet === 'photo' && photo && (
        <Sheet title={`📷 ${t('photo.title')}`} onClose={close}>
          <img
            src={photo.image}
            alt={pet.name}
            className="mx-auto w-full max-w-[16rem] rounded-xl shadow-lg"
          />
          <p role="status" className="mt-2 text-center text-sm font-bold text-candy-purple">
            ✓ {t('photo.saved')}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 pb-3">
            <button
              type="button"
              onClick={() => setSheet('album')}
              className="min-h-12 rounded-xl bg-violet-50 font-bold text-ink"
            >
              🖼️ {t('menu.album')}
            </button>
            <button
              type="button"
              onClick={() =>
                void shareOrDownload(dataUrlToFile(photo.image, `pocketpals-${pet.name}.jpg`))
              }
              className="min-h-12 rounded-xl bg-candy-pink font-black text-white"
            >
              📤 {t('photo.share')}
            </button>
          </div>
        </Sheet>
      )}
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
      {factOpen && factIndex !== null && (
        <FactCard pet={pet} index={factIndex} onClose={() => setFactOpen(false)} />
      )}
      {summary && <AwaySummary summary={summary} name={pet.name} onClose={dismissSummary} />}
      <BreakReminder name={pet.name} />
      <AchievementToast />
    </main>
  );
}
