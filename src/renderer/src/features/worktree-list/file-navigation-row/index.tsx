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

  return (
    <li>
      <button
        type="button"
        className={styles['file-navigation-row']}
        aria-label={`${path}, ${diffStatLabel(file.additions, file.deletions)}`}
        aria-current={active ? 'location' : undefined}
        style={{ paddingLeft: treeRowIndent(depth) }}
        onClick={() => onSelectFile(file.id)}
      >
        <IndentGuides depth={depth} />
        <span className={styles['file-navigation-row__path']} title={path}>
          {showDirectory && (
            <span className={styles['file-navigation-row__directory']}>{file.path.directory}</span>
          )}
          <FileIcon name={file.path.name} />
          <span className={styles['file-navigation-row__name']}>{file.path.name}</span>
        </span>
        <DiffStat additions={file.additions} deletions={file.deletions} />
      </button>
    </li>
  );
}
