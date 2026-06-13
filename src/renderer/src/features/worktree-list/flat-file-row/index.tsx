import type { ReactNode } from 'react';

import { cx } from '../../../shared/ui/cx';
import type { FileStatusBadge } from '../file-status';
import styles from '../index.module.scss';

interface FlatFileRowContentProps {
  status: FileStatusBadge;
  name: string;
  // Tooltip for the file name (full path, or a "old → new" rename hint).
  nameTitle: string;
  directory: string;
  // Optional trailing slot, e.g. a <DiffStat /> for changed-file rows.
  trailing?: ReactNode;
}

// The status box + name/directory layout shared by the interactive changed-file
// rows and the read-only unpushed-commit file rows. Callers own the row wrapper
// (a <button> when selectable, a <div> when not).
export function FlatFileRowContent({
  status,
  name,
  nameTitle,
  directory,
  trailing,
}: FlatFileRowContentProps) {
  return (
    <>
      <div
        className={cx(
          styles['file-navigation-row__status-box'],
          styles[`file-navigation-row__status-box--${status.cssClass}`]
        )}
      >
        {status.char}
      </div>
      <div className={styles['file-navigation-row__flat-content']}>
        <span className={styles['file-navigation-row__flat-main']}>
          <span className={styles['file-navigation-row__name']} title={nameTitle}>
            {name}
          </span>
          {trailing}
        </span>
        <span className={styles['file-navigation-row__directory']} title={directory}>
          {directory}
        </span>
      </div>
    </>
  );
}
