import { DiffStat, diffStatLabel } from '../../../shared/ui/diff-stat';
import { useFileListContext } from '../file-list-context';
import { changedFileStatusBadge, directoryLabel } from '../file-status';
import { FileIcon } from '../file-icon';
import { FlatFileRowContent } from '../flat-file-row';
import { IndentGuides, treeRowIndent } from '../indent-guides';
import type { FileNavigationRowProps } from './index.types';
import styles from '../index.module.scss';

export function FileNavigationRow({ file, depth, showDirectory }: FileNavigationRowProps) {
  const { activeFileId, onSelectFile } = useFileListContext();
  const active = file.id === activeFileId;
  const path = `${file.path.directory}${file.path.name}`;
  const directory = directoryLabel(file.path.directory);

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
          <FlatFileRowContent
            status={changedFileStatusBadge(file.status)}
            name={file.path.name}
            nameTitle={path}
            directory={directory}
            trailing={
              <DiffStat
                additions={file.additions}
                deletions={file.deletions}
                className={styles['file-navigation-row__diff-stat']}
              />
            }
          />
        ) : (
          <>
            <IndentGuides depth={depth} />
            <span className={styles['file-navigation-row__path']} title={path}>
              <FileIcon name={file.path.name} />
              <span className={styles['file-navigation-row__name']}>{file.path.name}</span>
            </span>
            <DiffStat
              additions={file.additions}
              deletions={file.deletions}
              emphasis="muted"
              className={styles['file-navigation-row__diff-stat']}
            />
          </>
        )}
      </button>
    </li>
  );
}
