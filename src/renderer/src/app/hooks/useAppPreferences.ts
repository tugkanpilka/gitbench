import { useCallback, useEffect, useState } from 'react';

import {
  applyTheme,
  type FileListMode,
  readAppPreferences,
  type Theme,
  writeAppPreferences,
} from '../../shared/preferences/appPreferences';

interface AppPreferenceController {
  theme: Theme;
  fileListMode: FileListMode;
  toggleTheme: () => void;
  setFileListMode: (mode: FileListMode) => void;
}

export function useAppPreferences(): AppPreferenceController {
  const [preferences, setPreferences] = useState(readAppPreferences);

  // Also runs on mount: re-applying the theme main.tsx already set is a no-op,
  // and the initial write normalizes any partial/legacy payload in storage.
  useEffect(() => {
    applyTheme(preferences.theme);
    writeAppPreferences(preferences);
  }, [preferences]);

  const toggleTheme = useCallback(() => {
    setPreferences((current) => ({
      ...current,
      theme: current.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  const setFileListMode = useCallback((fileListMode: FileListMode) => {
    setPreferences((current) => ({
      ...current,
      fileListMode,
    }));
  }, []);

  return {
    theme: preferences.theme,
    fileListMode: preferences.fileListMode,
    toggleTheme,
    setFileListMode,
  };
}
