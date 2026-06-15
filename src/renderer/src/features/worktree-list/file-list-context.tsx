import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { toggledSet } from '../../shared/collections/toggledSet';
import type { ChangedFileItem } from './changed-file-item';
import { directoryPathsForDirectory } from './utils/fileTree';

/**
 * Shared file-navigation state for the changed-files tree of the selected worktree.
 * Hosting it here removes the prop-drilling that previously threaded `activeFileId`,
 * `onSelectFile`, `collapsedDirectories` and `onToggleDirectory` through every level of
 * the recursive tree (ChangedFilesSection → FileNavigationList → FileTreeView → rows).
 */
export type FileListContextValue = {
  activeFileId: string | null;
  collapsedDirectories: ReadonlySet<string>;
  onToggleDirectory: (path: string) => void;
  onSelectFile: (fileId: string) => void;
};

const FileListContext = createContext<FileListContextValue | null>(null);

export type FileListProviderProps = {
  files: ChangedFileItem[];
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
  children: ReactNode;
};

function expandAncestorsForFile(current: Set<string>, directory: string): Set<string> {
  const activeDirectoryPaths = directoryPathsForDirectory(directory);
  if (!activeDirectoryPaths.some((path) => current.has(path))) {
    return current;
  }
  const next = new Set(current);
  for (const path of activeDirectoryPaths) {
    next.delete(path);
  }
  return next;
}

function useResetOnFilesChange(
  setCollapsed: (s: Set<string>) => void,
  files: ChangedFileItem[]
): void {
  useEffect(() => {
    setCollapsed(new Set());
  }, [files, setCollapsed]);
}

function useExpandActiveAncestors(
  setCollapsed: (updater: (cur: Set<string>) => Set<string>) => void,
  files: ChangedFileItem[],
  activeFileId: string | null
): void {
  useEffect(() => {
    const f = files.find((file) => file.id === activeFileId);
    if (f === undefined) {
      return;
    }
    setCollapsed((cur) => expandAncestorsForFile(cur, f.path.directory));
  }, [activeFileId, files, setCollapsed]);
}

function useCollapsedDirectories(
  files: ChangedFileItem[],
  activeFileId: string | null
): [ReadonlySet<string>, (path: string) => void] {
  const [collapsedDirectories, setCollapsedDirectories] = useState<Set<string>>(() => new Set());
  useResetOnFilesChange(setCollapsedDirectories, files);
  useExpandActiveAncestors(setCollapsedDirectories, files, activeFileId);
  const onToggleDirectory = useCallback(
    (path: string) => setCollapsedDirectories((current) => toggledSet(current, path)),
    []
  );
  return [collapsedDirectories, onToggleDirectory];
}

export function FileListProvider({
  files,
  activeFileId,
  onSelectFile,
  children,
}: FileListProviderProps) {
  const [collapsedDirectories, onToggleDirectory] = useCollapsedDirectories(files, activeFileId);

  const value = useMemo<FileListContextValue>(
    () => ({ activeFileId, collapsedDirectories, onSelectFile, onToggleDirectory }),
    [activeFileId, collapsedDirectories, onSelectFile, onToggleDirectory]
  );

  return <FileListContext.Provider value={value}>{children}</FileListContext.Provider>;
}

export function useFileListContext(): FileListContextValue {
  const value = useContext(FileListContext);
  if (value === null) {
    throw new Error('useFileListContext must be used within a FileListProvider');
  }
  return value;
}
