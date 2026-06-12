import { DiffStat, diffStatLabel } from '../../../shared/ui/diff-stat';
import { useFileListContext } from '../file-list-context';
import { FileIcon } from '../file-icon';
import { IndentGuides, treeRowIndent } from '../indent-guides';
import type { FileNavigationRowProps } from './index.types';
import styles from '../index.module.scss';

export function FileNavigationRow({ file, depth, showDirectory }: FileNavigationRowProps) {
  const { activeFileId, onSelectFile } = useFileListContext();
  const active = file.id === activeFileId;
  const path = `${file.path.directory}${file.path.name}`;
  const directory = file.path.directory === '' ? '/' : file.path.directory.replace(/\/$/, '');

  return (
    <li>
      <button
        type="button"
        className={`${styles['file-navigation-row']} ${
          showDirectory ? styles['file-navigation-row--flat'] : ''
        }`}
        aria-label={`${path}, ${diffStatLabel(file.additions, file.deletions)}`}
        aria-current={active ? 'location' : undefined}
        style={{ paddingLeft: treeRowIndent(depth) }}
        onClick={() => onSelectFile(file.id)}
      >
        {showDirectory ? (
          <>
            <span className={styles['file-navigation-row__flat-main']}>
              <span className={styles['file-navigation-row__name']} title={path}>
                {file.path.name}
              </span>
              <DiffStat additions={file.additions} deletions={file.deletions} />
            </span>
            <span className={styles['file-navigation-row__directory']} title={directory}>
              {directory}
            </span>
          </>
        ) : (
          <>
            <IndentGuides depth={depth} />
            <span className={styles['file-navigation-row__path']} title={path}>
              <FileIcon name={file.path.name} />
              <span className={styles['file-navigation-row__name']}>{file.path.name}</span>
            </span>
            <DiffStat additions={file.additions} deletions={file.deletions} />
          </>
        )}
      </button>
    </li>
  );
}
