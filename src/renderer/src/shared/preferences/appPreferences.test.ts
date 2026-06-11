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

describe('appPreferences', () => {
  it('uses the system theme only when no stored preference exists', () => {
    const { storage } = createStorage();

    expect(readAppPreferences(storage, true)).toEqual({
      theme: 'light',
      sidebarOpen: true,
      fileListMode: 'flat',
    });
    expect(readAppPreferences(storage, false)).toEqual({
      theme: 'dark',
      sidebarOpen: true,
      fileListMode: 'flat',
    });
  });

  it('prefers valid stored values and falls back per invalid field', () => {
    const { storage } = createStorage(
      JSON.stringify({
        theme: 'light',
        sidebarOpen: 'invalid',
        fileListMode: 'invalid',
      })
    );

    expect(readAppPreferences(storage, false)).toEqual({
      theme: 'light',
      sidebarOpen: true,
      fileListMode: 'flat',
    });
  });

  it('ignores malformed storage content', () => {
    const { storage } = createStorage('{not-json');

    expect(readAppPreferences(storage, false)).toEqual({
      theme: 'dark',
      sidebarOpen: true,
      fileListMode: 'flat',
    });
  });

  it('writes the versioned preference payload', () => {
    const { storage, getValue } = createStorage();

    writeAppPreferences({ theme: 'light', sidebarOpen: false, fileListMode: 'tree' }, storage);

    expect(getValue()).toBe(
      JSON.stringify({ theme: 'light', sidebarOpen: false, fileListMode: 'tree' })
    );
  });

  it('exposes the versioned storage key', () => {
    expect(APP_PREFERENCES_STORAGE_KEY).toBe('gitbench.ui-preferences.v1');
  });
});
