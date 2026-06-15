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
  it("defaults to the 'system' theme when no stored preference exists", () => {
    const { storage } = createStorage();

    // 'system' is a first-class stored value; it is resolved to light/dark at
    // apply time (see applyTheme), not when reading preferences.
    expect(readAppPreferences(storage)).toEqual({
      theme: 'system',
      fileListMode: 'flat',
      flatGroupMode: 'status',
    });
  });

  it('prefers valid stored values and falls back per invalid field', () => {
    const { storage } = createStorage(
      JSON.stringify({
        theme: 'light',
        sidebarOpen: false,
        fileListMode: 'invalid',
      })
    );

    expect(readAppPreferences(storage)).toEqual({
      theme: 'light',
      fileListMode: 'flat',
      flatGroupMode: 'status',
    });
  });

  it('ignores malformed storage content', () => {
    const { storage } = createStorage('{not-json');

    expect(readAppPreferences(storage)).toEqual({
      theme: 'system',
      fileListMode: 'flat',
      flatGroupMode: 'status',
    });
  });

  it('writes the versioned preference payload', () => {
    const { storage, getValue } = createStorage();

    writeAppPreferences({ theme: 'light', fileListMode: 'tree', flatGroupMode: 'none' }, storage);

    expect(getValue()).toBe(
      JSON.stringify({ theme: 'light', fileListMode: 'tree', flatGroupMode: 'none' })
    );
  });

  it('exposes the versioned storage key', () => {
    expect(APP_PREFERENCES_STORAGE_KEY).toBe('gitbench.ui-preferences.v1');
  });
});
