import { type Dispatch, type SetStateAction, useCallback, useEffect, useState } from 'react';

import {
  applyTheme,
  type AppPreferences,
  type FileListMode,
  type FlatGroupMode,
  readAppPreferences,
  type Theme,
  writeAppPreferences,
} from '../../shared/preferences/appPreferences';

function cycleTheme(current: Theme): Theme {
  if (current === 'system') return 'light';
  if (current === 'light') return 'dark';
  return 'system';
}

export interface AppPreferenceController {
  theme: Theme;
  fileListMode: FileListMode;
  flatGroupMode: FlatGroupMode;
  toggleTheme: () => void;
  setFileListMode: (mode: FileListMode) => void;
  setFlatGroupMode: (mode: FlatGroupMode) => void;
}

type Setter = Dispatch<SetStateAction<AppPreferences>>;

function makeFieldSetter<K extends keyof AppPreferences>(
  set: Setter,
  key: K
): (value: AppPreferences[K]) => void {
  return (value) => set((current) => ({ ...current, [key]: value }));
}

// eslint-disable-next-line max-lines-per-function -- two effects + three callbacks; prettier expands the nativeTheme effect to 4 lines; body already minimal
export function useAppPreferences(): AppPreferenceController {
  const [preferences, setPreferences] = useState(readAppPreferences);
  useEffect(() => {
    applyTheme(preferences.theme);
    writeAppPreferences(preferences);
  }, [preferences]);
  useEffect(
    () => window.api.onNativeThemeChanged(() => applyTheme(preferences.theme)),
    [preferences.theme]
  );
  const toggleTheme = useCallback(() => {
    setPreferences((current) => ({ ...current, theme: cycleTheme(current.theme) }));
  }, []);
  const setFileListMode = useCallback(makeFieldSetter(setPreferences, 'fileListMode'), []);
  const setFlatGroupMode = useCallback(makeFieldSetter(setPreferences, 'flatGroupMode'), []);
  return { ...preferences, toggleTheme, setFileListMode, setFlatGroupMode };
}
