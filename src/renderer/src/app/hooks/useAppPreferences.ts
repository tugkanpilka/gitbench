import { useCallback, useEffect, useState } from 'react';

import {
  applyTheme,
  type FileListMode,
  type FlatGroupMode,
  readAppPreferences,
  type Theme,
  watchSystemTheme,
  writeAppPreferences,
} from '../../shared/preferences/appPreferences';

interface AppPreferenceController {
  theme: Theme;
  fileListMode: FileListMode;
  flatGroupMode: FlatGroupMode;
  toggleTheme: () => void;
  setFileListMode: (mode: FileListMode) => void;
  setFlatGroupMode: (mode: FlatGroupMode) => void;
}

export function useAppPreferences(): AppPreferenceController {
  const [preferences, setPreferences] = useState(readAppPreferences);

  useEffect(() => {
    applyTheme(preferences.theme);
    writeAppPreferences(preferences);
  }, [preferences]);

  // Re-apply the theme when the OS preference flips, but only while following it.
  // Re-subscribes on theme change only, not on every preference write.
  useEffect(() => watchSystemTheme(() => applyTheme(preferences.theme)), [preferences.theme]);

  const toggleTheme = useCallback(() => {
    setPreferences((current) => {
      const nextTheme: Theme =
        current.theme === 'system' ? 'light' : current.theme === 'light' ? 'dark' : 'system';
      return { ...current, theme: nextTheme };
    });
  }, []);

  const setFileListMode = useCallback((fileListMode: FileListMode) => {
    setPreferences((current) => ({
      ...current,
      fileListMode,
    }));
  }, []);

  const setFlatGroupMode = useCallback((flatGroupMode: FlatGroupMode) => {
    setPreferences((current) => ({
      ...current,
      flatGroupMode,
    }));
  }, []);

  return {
    theme: preferences.theme,
    fileListMode: preferences.fileListMode,
    flatGroupMode: preferences.flatGroupMode,
    toggleTheme,
    setFileListMode,
    setFlatGroupMode,
  };
}
