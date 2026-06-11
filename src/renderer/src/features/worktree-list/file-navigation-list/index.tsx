import { useEffect, useMemo, useState } from 'react';

import { toggledSet } from '../../../shared/collections/toggledSet';
import { buildFileTree, directoryPathsForFile } from '../utils/fileTree';
import { FileNavigationRow } from '../file-navigation-row';
import { FileTreeView } from '../file-tree-view';
import type { FileNavigationListProps } from './index.types';
import styles from '../index.module.scss';

export function FileNavigationList({
  files,
  mode,
  activeFileId,
  onSelectFile,
}: FileNavigationListProps) {
  const [collapsedDirectories, setCollapsedDirectories] = useState<Set<string>>(() => new Set());
  const tree = useMemo(() => buildFileTree(files), [files]);

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

  if (files.length === 0) {
    return null;
  }

  if (mode === 'tree') {
    const toggleDirectory = (path: string) => {
      setCollapsedDirectories((current) => toggledSet(current, path));
    };

    return (
      <FileTreeView
        tree={tree}
        depth={0}
        activeFileId={activeFileId}
        collapsedDirectories={collapsedDirectories}
        onToggleDirectory={toggleDirectory}
        onSelectFile={onSelectFile}
      />
    );
  }

  return (
    <ul className={styles['file-navigation-list']} aria-label="Changed files">
      {files.map((file) => (
        <FileNavigationRow
          key={file.id}
          file={file}
          active={file.id === activeFileId}
          depth={0}
          showDirectory
          onSelect={() => onSelectFile(file.id)}
        />
      ))}
    </ul>
  );
}
