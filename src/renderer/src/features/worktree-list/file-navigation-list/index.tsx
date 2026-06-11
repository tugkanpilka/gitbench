import { useMemo } from 'react';

import { buildFileTree } from '../utils/fileTree';
import { FileNavigationRow } from '../file-navigation-row';
import { FileTreeView } from '../file-tree-view';
import type { FileNavigationListProps } from './index.types';
import styles from '../index.module.scss';

export function FileNavigationList({ files, mode }: FileNavigationListProps) {
  const tree = useMemo(() => buildFileTree(files), [files]);

  if (files.length === 0) {
    return null;
  }

  if (mode === 'tree') {
    return <FileTreeView tree={tree} depth={0} />;
  }

  return (
    <ul className={styles['file-navigation-list']} aria-label="Changed files">
      {files.map((file) => (
        <FileNavigationRow key={file.id} file={file} depth={0} showDirectory />
      ))}
    </ul>
  );
}
