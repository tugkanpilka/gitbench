import { useCallback, useEffect, useState } from 'react';

import {
  applyTheme,
  type FileListMode,
  readAppPreferences,
  type Theme,
  writeAppPreferences,
} from '../shared/preferences/appPreferences';

interface AppPreferenceController {
  theme: Theme;
  sidebarOpen: boolean;
  fileListMode: FileListMode;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setFileListMode: (mode: FileListMode) => void;
}

export function useAppPreferences(): AppPreferenceController {
  const [preferences, setPreferences] = useState(readAppPreferences);

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

  const toggleSidebar = useCallback(() => {
    setPreferences((current) => ({
      ...current,
      sidebarOpen: !current.sidebarOpen,
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
    sidebarOpen: preferences.sidebarOpen,
    fileListMode: preferences.fileListMode,
    toggleTheme,
    toggleSidebar,
    setFileListMode,
  };
}
