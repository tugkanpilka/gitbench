import type { ReactNode } from 'react';

import { cx } from '../../../shared/ui/cx';
import type { FileStatusBadge } from '../file-status';
import styles from '../index.module.scss';

interface FlatFileRowContentProps {
  status: FileStatusBadge;
  name: string;
  nameTitle: string;
  directory: string;
  trailing?: ReactNode;
}

interface FileNameBlockProps { name: string; nameTitle: string; directory: string; trailing?: ReactNode }

function FileNameBlock({ name, nameTitle, directory, trailing }: FileNameBlockProps) {
  return (
    <div className={styles['file-navigation-row__flat-content']}>
      <span className={styles['file-navigation-row__flat-main']}>
        <span className={styles['file-navigation-row__name']} title={nameTitle}>{name}</span>
        {trailing}
      </span>
      <span className={styles['file-navigation-row__directory']} title={directory}>{directory}</span>
    </div>
  );
}

// The status box + name/directory layout shared by the interactive changed-file
// rows and the read-only unpushed-commit file rows. Callers own the row wrapper
// (a <button> when selectable, a <div> when not).
export function FlatFileRowContent({ status, name, nameTitle, directory, trailing }: FlatFileRowContentProps) {
  return (
    <>
      <div className={cx(styles['file-navigation-row__status-box'], styles[`file-navigation-row__status-box--${status.cssClass}`])}>
        {status.char}
      </div>
      <FileNameBlock name={name} nameTitle={nameTitle} directory={directory} trailing={trailing} />
    </>
  );
}
