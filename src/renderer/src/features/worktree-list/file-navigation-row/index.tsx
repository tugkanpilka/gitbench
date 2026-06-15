import { cx } from '../../../shared/ui/cx';
import { Match, Switch } from '../../../shared/ui/switch';
import { DiffStat, diffStatLabel } from '../../../shared/ui/diff-stat';
import { useFileListContext } from '../file-list-context';
import { changedFileStatusBadge, directoryLabel } from '../file-status';
import { FileIcon } from '../file-icon';
import { FlatFileRowContent } from '../flat-file-row';
import { IndentGuides, treeRowIndent } from '../indent-guides';
import type { ChangedFileItem } from '../changed-file-item';
import type { FileNavigationRowProps } from './index.types';
import styles from '../index.module.scss';

function TreeFileDiffStat({ file }: { file: ChangedFileItem }) {
  return (
    <DiffStat
      additions={file.additions}
      deletions={file.deletions}
      emphasis="muted"
      className={styles['file-navigation-row__diff-stat']}
    />
  );
}

function TreeModeContent({ file, depth }: { file: ChangedFileItem; depth: number }) {
  const path = `${file.path.directory}${file.path.name}`;
  return (
    <>
      <IndentGuides depth={depth} />
      <span className={styles['file-navigation-row__path']} title={path}>
        <FileIcon name={file.path.name} />
        <span className={styles['file-navigation-row__name']}>{file.path.name}</span>
      </span>
      <TreeFileDiffStat file={file} />
    </>
  );
}

function FlatDiffStat({ file }: { file: ChangedFileItem }) {
  return (
    <DiffStat
      additions={file.additions}
      deletions={file.deletions}
      className={styles['file-navigation-row__diff-stat']}
    />
  );
}

// eslint-disable-next-line max-lines-per-function -- pure JSX flat row content; inline type definition spans multiple lines inflating count
function FlatModeContent({
  file,
  path,
  directory,
}: {
  file: ChangedFileItem;
  path: string;
  directory: string;
}) {
  return (
    <FlatFileRowContent
      status={changedFileStatusBadge(file.status)}
      name={file.path.name}
      nameTitle={path}
      directory={directory}
      trailing={<FlatDiffStat file={file} />}
    />
  );
}

// eslint-disable-next-line max-lines-per-function -- pure JSX button with Switch/Match; inline type definition and multi-prop Prettier formatting inflate count
function RowButton({
  file,
  depth,
  showDirectory,
  active,
  onSelectFile,
}: {
  file: ChangedFileItem;
  depth: number;
  showDirectory: boolean;
  active: boolean;
  onSelectFile: (id: string) => void;
}) {
  const path = `${file.path.directory}${file.path.name}`;
  const directory = directoryLabel(file.path.directory);
  const className = cx(
    styles['file-navigation-row'],
    showDirectory && styles['file-navigation-row--flat']
  );
  return (
    <button
      type="button"
      className={className}
      aria-label={`${path}, ${diffStatLabel(file.additions, file.deletions)}`}
      aria-current={active ? 'location' : undefined}
      style={{ paddingLeft: treeRowIndent(depth) }}
      onClick={() => onSelectFile(file.id)}
    >
      <Switch>
        <Match when={showDirectory}>
          <FlatModeContent file={file} path={path} directory={directory} />
        </Match>
        <Match when={true}>
          <TreeModeContent file={file} depth={depth} />
        </Match>
      </Switch>
    </button>
  );
}

export function FileNavigationRow({ file, depth, showDirectory }: FileNavigationRowProps) {
  const { activeFileId, onSelectFile } = useFileListContext();
  const active = file.id === activeFileId;
  return (
    <li>
      <RowButton
        file={file}
        depth={depth}
        showDirectory={showDirectory}
        active={active}
        onSelectFile={onSelectFile}
      />
    </li>
  );
}
