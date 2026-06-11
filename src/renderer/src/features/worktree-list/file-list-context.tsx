import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { toggledSet } from '../../shared/collections/toggledSet';
import type { DiffFileModel } from '../diff-viewer/utils/diffModel.types';
import { directoryPathsForFile } from './utils/fileTree';

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
  files: DiffFileModel[];
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
  children: ReactNode;
};

export function FileListProvider({
  files,
  activeFileId,
  onSelectFile,
  children,
}: FileListProviderProps) {
  const [collapsedDirectories, setCollapsedDirectories] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setCollapsedDirectories(new Set());
  }, [files]);

  // Expand every collapsed ancestor of the active file so it stays visible.
  useEffect(() => {
    const activeFile = files.find((file) => file.id === activeFileId);
    if (activeFile === undefined) {
      return;
    }

    const activeDirectoryPaths = directoryPathsForFile(activeFile);
    setCollapsedDirectories((current) => {
      if (!activeDirectoryPaths.some((path) => current.has(path))) {
        return current;
      }

      const next = new Set(current);
      for (const path of activeDirectoryPaths) {
        next.delete(path);
      }
      return next;
    });
  }, [activeFileId, files]);

  const value = useMemo<FileListContextValue>(
    () => ({
      activeFileId,
      collapsedDirectories,
      onSelectFile,
      onToggleDirectory: (path) => setCollapsedDirectories((current) => toggledSet(current, path)),
    }),
    [activeFileId, collapsedDirectories, onSelectFile]
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
