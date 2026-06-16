import { describe, expect, it } from 'vitest';

import {
  APP_PREFERENCES_STORAGE_KEY,
  readAppPreferences,
  type PreferenceStorage,
  writeAppPreferences,
} from './appPreferences';

function createStorage(initialValue: string | null = null): {
  storage: PreferenceStorage;
  getValue: () => string | null;
} {
  let value = initialValue;

  return {
    storage: {
      getItem: () => value,
      setItem: (_key, nextValue) => {
        value = nextValue;
      },
    },
    getValue: () => value,
  };
}

// eslint-disable-next-line max-lines-per-function
describe('appPreferences', () => {
  it('falls back to defaults when no stored preference exists', () => {
    const { storage } = createStorage();

    expect(readAppPreferences(storage)).toEqual({
      fileListMode: 'flat',
      flatGroupMode: 'status',
    });
  });

  it('prefers valid stored values and falls back per invalid field', () => {
    const { storage } = createStorage(
      JSON.stringify({
        sidebarOpen: false,
        fileListMode: 'invalid',
      })
    );

    expect(readAppPreferences(storage)).toEqual({
      fileListMode: 'flat',
      flatGroupMode: 'status',
    });
  });

  it('ignores malformed storage content', () => {
    const { storage } = createStorage('{not-json');

    expect(readAppPreferences(storage)).toEqual({
      fileListMode: 'flat',
      flatGroupMode: 'status',
    });
  });

  it('writes the versioned preference payload', () => {
    const { storage, getValue } = createStorage();

    writeAppPreferences({ fileListMode: 'tree', flatGroupMode: 'none' }, storage);

    expect(getValue()).toBe(JSON.stringify({ fileListMode: 'tree', flatGroupMode: 'none' }));
  });

  it('exposes the versioned storage key', () => {
    expect(APP_PREFERENCES_STORAGE_KEY).toBe('gitbench.ui-preferences.v1');
  });
});
