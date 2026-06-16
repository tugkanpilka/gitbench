import { type Dispatch, type SetStateAction, useCallback, useEffect, useState } from 'react';

import {
  type AppPreferences,
  type FileListMode,
  type FlatGroupMode,
  readAppPreferences,
  writeAppPreferences,
} from '../../shared/preferences/appPreferences';

export interface AppPreferenceController {
  fileListMode: FileListMode;
  flatGroupMode: FlatGroupMode;
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

export function useAppPreferences(): AppPreferenceController {
  const [preferences, setPreferences] = useState(readAppPreferences);
  useEffect(() => {
    writeAppPreferences(preferences);
  }, [preferences]);
  const setFileListMode = useCallback(makeFieldSetter(setPreferences, 'fileListMode'), []);
  const setFlatGroupMode = useCallback(makeFieldSetter(setPreferences, 'flatGroupMode'), []);
  return { ...preferences, setFileListMode, setFlatGroupMode };
}
