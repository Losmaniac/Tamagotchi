import { useRef, useState, type ReactNode } from 'react';
import { formatClock, parseClock } from '../../game/sleep';
import { useT } from '../../i18n/useT';
import { useAppStore } from '../../store/useAppStore';
import { LanguageToggle } from '../components/LanguageToggle';
import { Sheet } from '../components/Sheet';
import { Toggle } from '../components/Toggle';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-ink/10 py-3 last:border-0">
      <h3 className="mb-1 text-xs font-black tracking-wide text-ink/50 uppercase">{title}</h3>
      {children}
    </section>
  );
}

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface SettingsSheetProps {
  onClose: () => void;
  onOpen: (sheet: 'memorial' | 'achievements') => void;
  installSlot?: ReactNode;
}

export function SettingsSheet({ onClose, onOpen, installSlot }: SettingsSheetProps) {
  const { t } = useT();
  const settings = useAppStore((s) => s.settings);
  const update = useAppStore((s) => s.updateSettings);
  const exportSave = useAppStore((s) => s.exportSave);
  const importSave = useAppStore((s) => s.importSave);
  const resetGame = useAppStore((s) => s.resetGame);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetStep, setResetStep] = useState(0);

  const onExport = () => {
    const day = new Date().toISOString().slice(0, 10);
    downloadText(`pocketpals-save-${day}.json`, exportSave());
  };
  const onImport = async (file: File | undefined) => {
    if (!file) return;
    const ok = importSave(await file.text());
    setMessage(ok ? t('settings.importOk') : t('settings.importFail'));
    if (fileRef.current) fileRef.current.value = '';
  };
  const setBed = (key: 'start' | 'end', value: string) => {
    const m = parseClock(value);
    if (m !== null) update({ bedtime: { ...settings.bedtime, [key]: m } });
  };

  return (
    <Sheet title={t('settings.title')} onClose={onClose} full>
      <Section title={t('settings.language')}>
        <LanguageToggle />
      </Section>

      <Section title={t('settings.general')}>
        <Toggle
          label={`🔊 ${t('settings.sound')}`}
          checked={settings.sound}
          onChange={(v) => update({ sound: v })}
        />
        <Toggle
          label={`📳 ${t('settings.haptics')}`}
          checked={settings.haptics}
          onChange={(v) => update({ haptics: v })}
        />
        <Toggle
          label={`🔋 ${t('settings.lowPower')}`}
          description={t('settings.lowPowerDesc')}
          checked={settings.lowPower}
          onChange={(v) => update({ lowPower: v })}
        />
      </Section>

      <Section title={`🌙 ${t('settings.bedtime')}`}>
        <div className="grid grid-cols-2 gap-3">
          {(['start', 'end'] as const).map((k) => (
            <label key={k} className="block">
              <span className="text-sm font-bold text-ink/70">
                {t(k === 'start' ? 'settings.bedtimeStart' : 'settings.bedtimeEnd')}
              </span>
              <input
                type="time"
                value={formatClock(settings.bedtime[k])}
                onChange={(e) => setBed(k, e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border-2 border-ink/10 bg-white px-3 font-bold text-ink"
              />
            </label>
          ))}
        </div>
      </Section>

      <Section title={t('settings.save')}>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onOpen('memorial')}
            className="min-h-12 rounded-xl bg-indigo-50 font-bold text-ink"
          >
            🪦 {t('memorial.title')}
          </button>
          <button
            type="button"
            onClick={() => onOpen('achievements')}
            className="min-h-12 rounded-xl bg-amber-50 font-bold text-ink"
          >
            🏅 {t('ach.title')}
          </button>
        </div>
        <p className="mt-3 text-sm text-ink/60">{t('settings.backupHint')}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onExport}
            className="min-h-12 rounded-xl bg-emerald-50 font-bold text-ink"
          >
            ⬇️ {t('settings.export')}
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="min-h-12 rounded-xl bg-sky-50 font-bold text-ink"
          >
            ⬆️ {t('settings.import')}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => void onImport(e.target.files?.[0])}
          aria-label={t('settings.import')}
        />
        {message && (
          <p role="status" className="mt-2 text-sm font-bold text-candy-purple">
            {message}
          </p>
        )}
        {installSlot}
      </Section>

      <Section title={t('settings.reset')}>
        {resetStep === 0 && (
          <button
            type="button"
            onClick={() => setResetStep(1)}
            className="min-h-12 w-full rounded-xl bg-rose-50 font-bold text-rose-700"
          >
            🗑️ {t('settings.reset')}
          </button>
        )}
        {resetStep > 0 && (
          <div
            role="alertdialog"
            aria-label={t('settings.reset')}
            className="rounded-2xl bg-rose-50 p-3"
          >
            <p className="font-bold text-rose-800">
              {t(resetStep === 1 ? 'settings.resetConfirm1' : 'settings.resetConfirm2')}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setResetStep(0)}
                className="min-h-12 rounded-xl bg-white font-bold text-ink"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (resetStep === 1) return setResetStep(2);
                  resetGame();
                  onClose();
                }}
                className="min-h-12 rounded-xl bg-rose-600 font-bold text-white"
              >
                {resetStep === 1 ? t('common.yes') : t('settings.resetYes')}
              </button>
            </div>
          </div>
        )}
      </Section>
      <p className="py-3 text-center text-xs text-ink/40">Pocket Pals v{__APP_VERSION__}</p>
    </Sheet>
  );
}
