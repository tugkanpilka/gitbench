import { useState } from 'react';
import type {
  CommitDto,
  CommitFileChange,
  CommitFileChangeStatus,
} from '../../../../../contracts/ipc';
import { toggledSet } from '../../../shared/collections/toggledSet';
import { cx } from '../../../shared/ui/cx';
import { Chevron } from '../../../shared/ui/icons';
import { splitPath } from '../../diff-viewer/utils/diffModel';
import { FileIcon } from '../file-icon';
import type { UnpushedCommitsSectionProps } from './index.types';
import sharedStyles from '../index.module.scss';
import styles from './index.module.scss';

type Tone = 'added' | 'deleted' | 'modified' | 'neutral';
type StatusMeta = { group: string; tone: Tone };

const STATUS_META: Record<CommitFileChangeStatus, StatusMeta> = {
  added: { group: 'Added', tone: 'added' },
  modified: { group: 'Modified', tone: 'modified' },
  deleted: { group: 'Deleted', tone: 'deleted' },
  renamed: { group: 'Renamed', tone: 'neutral' },
  copied: { group: 'Copied', tone: 'neutral' },
  typeChanged: { group: 'Type changed', tone: 'neutral' },
  unmerged: { group: 'Unmerged', tone: 'deleted' },
  unknown: { group: 'Changed', tone: 'neutral' },
};

// Stable group order so a commit's files always read added → modified → deleted → ….
const GROUP_ORDER: CommitFileChangeStatus[] = [
  'added',
  'modified',
  'deleted',
  'renamed',
  'copied',
  'typeChanged',
  'unmerged',
  'unknown',
];

type FileGroup = { status: CommitFileChangeStatus; meta: StatusMeta; files: CommitFileChange[] };

function groupFilesByStatus(files: CommitFileChange[]): FileGroup[] {
  const byStatus = new Map<CommitFileChangeStatus, CommitFileChange[]>();
  for (const file of files) {
    const bucket = byStatus.get(file.status);
    if (bucket) {
      bucket.push(file);
    } else {
      byStatus.set(file.status, [file]);
    }
  }
  return GROUP_ORDER.filter((status) => byStatus.has(status)).map((status) => ({
    status,
    meta: STATUS_META[status],
    files: byStatus.get(status) ?? [],
  }));
}

/** Read-only list of unpushed commits for the selected worktree, each with its files. */
export function UnpushedCommitsSection({ commits, truncated }: UnpushedCommitsSectionProps) {
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(() => new Set());

  return (
    <section className={styles['unpushed-commits']} aria-label="Unpushed commits">
      <header className={sharedStyles['worktree-files-section__header']}>
        <h2 className={sharedStyles['worktree-files-section__label']}>Unpushed</h2>
        <span className={styles['unpushed-commits__count']}>
          {commits.length}
          {truncated ? '+' : ''}
        </span>
      </header>

      <ul className={styles['unpushed-commits__list']}>
        {commits.map((commit) => (
          <CommitItem
            key={commit.sha}
            commit={commit}
            expanded={expandedCommits.has(commit.sha)}
            onToggle={() => setExpandedCommits((current) => toggledSet(current, commit.sha))}
          />
        ))}
      </ul>

      {truncated && (
        <p className={styles['unpushed-commits__truncated']}>
          Showing the latest {commits.length} commits.
        </p>
      )}
    </section>
  );
}

function CommitItem({
  commit,
  expanded,
  onToggle,
}: {
  commit: CommitDto;
  expanded: boolean;
  onToggle: () => void;
}) {
  const groups = groupFilesByStatus(commit.files);
  return (
    <li className={styles['commit']}>
      <button
        type="button"
        className={styles['commit__header']}
        title={`${commit.shortSha} · ${commit.author}`}
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <Chevron collapsed={!expanded} className={styles['commit__chevron']} />
        <span className={styles['commit__sha']}>{commit.shortSha}</span>
        <span className={styles['commit__subject']}>{commit.subject}</span>
        <span className={styles['commit__file-count']}>{commit.files.length}</span>
      </button>
      {expanded && groups.map((group) => <FileGroupView key={group.status} group={group} />)}
    </li>
  );
}

function FileGroupView({ group }: { group: FileGroup }) {
  return (
    <div className={styles['commit-group']}>
      <span
        className={cx(
          styles['commit-group__label'],
          styles[`commit-group__label--${group.meta.tone}`]
        )}
      >
        {group.meta.group}
        <span className={styles['commit-group__count']}>{group.files.length}</span>
      </span>
      <ul className={styles['commit-group__files']}>
        {group.files.map((file, index) => (
          <CommitFileRow key={`${file.path}:${index}`} file={file} />
        ))}
      </ul>
    </div>
  );
}

function CommitFileRow({ file }: { file: CommitFileChange }) {
  const { directory, name } = splitPath(file.path);
  const title = file.previousPath !== null ? `${file.previousPath} → ${file.path}` : file.path;

  return (
    <li className={styles['commit-file']}>
      <span className={styles['commit-file__path']} title={title}>
        {directory && <span className={styles['commit-file__dir']}>{directory}</span>}
        <FileIcon name={name} />
        <span className={styles['commit-file__name']}>{name}</span>
      </span>
    </li>
  );
}
