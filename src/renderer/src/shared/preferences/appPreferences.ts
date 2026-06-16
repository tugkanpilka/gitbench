export type FileListMode = 'flat' | 'tree';
export type FlatGroupMode = 'status' | 'none';

export interface AppPreferences {
  fileListMode: FileListMode;
  flatGroupMode: FlatGroupMode;
}

export interface PreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const APP_PREFERENCES_STORAGE_KEY = 'gitbench.ui-preferences.v1';

function isFileListMode(value: unknown): value is FileListMode {
  return value === 'flat' || value === 'tree';
}

function isFlatGroupMode(value: unknown): value is FlatGroupMode {
  return value === 'status' || value === 'none';
}

export function getPreferenceStorage(): PreferenceStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function parseStoredPreferences(raw: string, defaults: AppPreferences): AppPreferences {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null) return defaults;
  const c = parsed as Partial<AppPreferences>;
  return {
    fileListMode: isFileListMode(c.fileListMode) ? c.fileListMode : defaults.fileListMode,
    flatGroupMode: isFlatGroupMode(c.flatGroupMode) ? c.flatGroupMode : defaults.flatGroupMode,
  };
}

// eslint-disable-next-line max-lines-per-function -- defaults literal + guard + try/catch exhaust 15 lines; no meaningful sub-function to extract
export function readAppPreferences(
  storage: PreferenceStorage | null = getPreferenceStorage()
): AppPreferences {
  const defaults: AppPreferences = {
    fileListMode: 'flat',
    flatGroupMode: 'status',
  };
  if (storage === null) return defaults;
  try {
    const storedValue = storage.getItem(APP_PREFERENCES_STORAGE_KEY);
    if (storedValue === null) return defaults;
    return parseStoredPreferences(storedValue, defaults);
  } catch {
    return defaults;
  }
}

export function writeAppPreferences(
  preferences: AppPreferences,
  storage: PreferenceStorage | null = getPreferenceStorage()
): void {
  if (storage === null) {
    return;
  }

  try {
    storage.setItem(APP_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Preferences are optional; storage failures must not block the renderer.
  }
}
