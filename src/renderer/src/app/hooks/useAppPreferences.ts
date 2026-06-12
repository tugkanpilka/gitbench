import { useCallback, useEffect, useState } from 'react';

import {
  applyTheme,
  type FileListMode,
  type FlatGroupMode,
  readAppPreferences,
  type Theme,
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

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = () => {
      // Re-apply the theme when the system preference changes
      applyTheme(preferences.theme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [preferences]);

  const toggleTheme = useCallback(() => {
    setPreferences((current) => {
      let nextTheme: Theme = 'system';
      if (current.theme === 'system') nextTheme = 'light';
      else if (current.theme === 'light') nextTheme = 'dark';
      else nextTheme = 'system';
      
      return {
        ...current,
        theme: nextTheme,
      };
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
