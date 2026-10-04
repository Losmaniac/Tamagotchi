// Persisted save shape + migrations. Pure TS: no framework imports.

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'pocketpals:v1';

export type Locale = 'en' | 'cs';

export interface Settings {
  locale: Locale;
}

export interface SaveData {
  schemaVersion: number;
  settings: Settings;
}

export function createDefaultSave(locale: Locale): SaveData {
  return { schemaVersion: SCHEMA_VERSION, settings: { locale } };
}

type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

/**
 * migrations[n] upgrades a save from version n to n + 1.
 * Add an entry here whenever SaveData changes shape, then bump SCHEMA_VERSION.
 */
const migrations: Record<number, Migration> = {
  0: (data) => ({ ...data, schemaVersion: 1 }),
};

export function migrateSave(raw: unknown, fromVersion: number, fallbackLocale: Locale): SaveData {
  if (typeof raw !== 'object' || raw === null || fromVersion > SCHEMA_VERSION) {
    return createDefaultSave(fallbackLocale);
  }
  let data = { ...(raw as Record<string, unknown>) };
  for (let v = fromVersion; v < SCHEMA_VERSION; v++) {
    const step = migrations[v];
    if (!step) return createDefaultSave(fallbackLocale);
    data = step(data);
  }
  const defaults = createDefaultSave(fallbackLocale);
  const settings = (data.settings ?? {}) as Partial<Settings>;
  return {
    ...defaults,
    settings: {
      ...defaults.settings,
      ...(settings.locale === 'en' || settings.locale === 'cs' ? { locale: settings.locale } : {}),
    },
    schemaVersion: SCHEMA_VERSION,
  };
}
