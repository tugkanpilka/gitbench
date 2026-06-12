export type Theme = 'system' | 'dark' | 'light';
export type FileListMode = 'flat' | 'tree';
export type FlatGroupMode = 'status' | 'none';

export interface AppPreferences {
  theme: Theme;
  fileListMode: FileListMode;
  flatGroupMode: FlatGroupMode;
}

export interface PreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const APP_PREFERENCES_STORAGE_KEY = 'gitbench.ui-preferences.v1';

function isTheme(value: unknown): value is Theme {
  return value === 'system' || value === 'dark' || value === 'light';
}

function isFileListMode(value: unknown): value is FileListMode {
  return value === 'flat' || value === 'tree';
}

function isFlatGroupMode(value: unknown): value is FlatGroupMode {
  return value === 'status' || value === 'none';
}

export function prefersLightTheme(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: light)').matches
  );
}

export function getPreferenceStorage(): PreferenceStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readAppPreferences(
  storage: PreferenceStorage | null = getPreferenceStorage(),
  systemPrefersLight = prefersLightTheme()
): AppPreferences {
  const defaults: AppPreferences = {
    theme: 'system',
    fileListMode: 'flat',
    flatGroupMode: 'status',
  };

  if (storage === null) {
    return defaults;
  }

  try {
    const storedValue = storage.getItem(APP_PREFERENCES_STORAGE_KEY);
    if (storedValue === null) {
      return defaults;
    }

    const parsed: unknown = JSON.parse(storedValue);
    if (typeof parsed !== 'object' || parsed === null) {
      return defaults;
    }

    const candidate = parsed as Partial<AppPreferences>;
    return {
      theme: isTheme(candidate.theme) ? candidate.theme : defaults.theme,
      fileListMode: isFileListMode(candidate.fileListMode)
        ? candidate.fileListMode
        : defaults.fileListMode,
      flatGroupMode: isFlatGroupMode(candidate.flatGroupMode)
        ? candidate.flatGroupMode
        : defaults.flatGroupMode,
    };
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

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') {
    return;
  }

  const effectiveTheme = theme === 'system' ? (prefersLightTheme() ? 'light' : 'dark') : theme;

  if (effectiveTheme === 'light') {
    document.documentElement.dataset.theme = 'light';
  } else {
    delete document.documentElement.dataset.theme;
  }
}
