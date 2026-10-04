import { describe, expect, it } from 'vitest';
import { SCHEMA_VERSION, createDefaultSave, migrateSave } from '../src/game/save';

describe('migrateSave', () => {
  it('upgrades a version 0 save, keeping a valid locale', () => {
    expect(migrateSave({ settings: { locale: 'cs' } }, 0, 'en')).toEqual({
      schemaVersion: SCHEMA_VERSION,
      settings: { locale: 'cs' },
    });
  });

  it('drops invalid fields back to defaults', () => {
    expect(migrateSave({ settings: { locale: 'xx' } }, 0, 'en').settings.locale).toBe('en');
  });

  it('resets garbage or saves from a newer version', () => {
    expect(migrateSave(null, 0, 'cs')).toEqual(createDefaultSave('cs'));
    expect(migrateSave({ settings: { locale: 'cs' } }, SCHEMA_VERSION + 1, 'en')).toEqual(
      createDefaultSave('en'),
    );
  });

  it('resets saves with no migration path', () => {
    expect(migrateSave({}, -5, 'en')).toEqual(createDefaultSave('en'));
  });
});
