import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  SCHEMA_VERSION,
  STORAGE_KEY,
  createDefaultSave,
  migrateSave,
  type Locale,
  type SaveData,
} from '../game/save';
import { detectLocale } from '../i18n/translate';
import { safeStorage } from './safeStorage';

interface AppActions {
  setLocale: (locale: Locale) => void;
}

export type AppState = SaveData & AppActions;

const browserLocale = (): Locale =>
  detectLocale(typeof navigator === 'undefined' ? undefined : navigator.languages);

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...createDefaultSave(browserLocale()),
      setLocale: (locale) => set((s) => ({ settings: { ...s.settings, locale } })),
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => safeStorage),
      partialize: ({ schemaVersion, settings }): SaveData => ({ schemaVersion, settings }),
      migrate: (persisted, version) => migrateSave(persisted, version, browserLocale()),
    },
  ),
);
