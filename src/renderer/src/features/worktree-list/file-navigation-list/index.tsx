import { useMemo } from 'react';

import { Match, Switch } from '../../../shared/ui/switch';
import { buildFileTree } from '../utils/fileTree';
import { FileNavigationRow } from '../file-navigation-row';
import { FileTreeView } from '../file-tree-view';
import type { FileNavigationListProps } from './index.types';
import type { ChangedFileItem } from '../changed-file-item';
import styles from '../index.module.scss';

function FlatFileList({ files }: { files: ChangedFileItem[] }) {
  return (
    <ul className={styles['file-navigation-list']} aria-label="Changed files">
      {files.map((file) => (
        <FileNavigationRow key={file.id} file={file} depth={0} showDirectory />
      ))}
    </ul>
  );
}

export function FileNavigationList({ files, mode }: FileNavigationListProps) {
  const tree = useMemo(() => buildFileTree(files), [files]);
  return (
    <Switch>
      <Match when={files.length === 0}>{null}</Match>
      <Match when={mode === 'tree'}>
        <FileTreeView tree={tree} depth={0} />
      </Match>
      <Match when={true}>
        <FlatFileList files={files} />
      </Match>
    </Switch>
  );
}
