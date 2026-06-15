import { useState } from 'react';
import type {
  CommitDto,
  CommitFileChange,
  CommitFileChangeStatus,
} from '../../../../../contracts/ipc';
import { toggledSet } from '../../../shared/collections/toggledSet';
import { cx } from '../../../shared/ui/cx';
import { Visibility } from '../../../shared/ui/visibility';
import { Chevron } from '../../../shared/ui/icons';
import { splitPath } from '../../diff-viewer/utils/diffModel';
import { commitFileStatusBadge, directoryLabel } from '../file-status';
import { FlatFileRowContent } from '../flat-file-row';
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

export function UnpushedCommitsSection({ commits, truncated }: UnpushedCommitsSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(() => new Set());
  const countLabel = truncated ? `${commits.length}+` : String(commits.length);

  return (
    <section className={styles['unpushed-commits']} aria-label="Unpushed commits">
      <button
        type="button"
        className={styles['unpushed-commits__header']}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className={styles['unpushed-commits__label']}>Unpushed</span>
        <span className={styles['unpushed-commits__count']}>{countLabel}</span>
        <Chevron collapsed={!expanded} className={styles['unpushed-commits__chevron']} />
      </button>

      <Visibility isVisible={expanded}>
        <div className={styles['unpushed-commits__content']}>
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

          <Visibility isVisible={truncated}>
            <p className={styles['unpushed-commits__truncated']}>
              Showing the latest {commits.length} commits.
            </p>
          </Visibility>
        </div>
      </Visibility>
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
      <Visibility isVisible={expanded}>
        {groups.map((group) => (
          <FileGroupView key={group.status} group={group} />
        ))}
      </Visibility>
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
  const nameTitle = file.previousPath !== null ? `${file.previousPath} → ${file.path}` : file.path;

  return (
    <li>
      <div
        className={cx(
          sharedStyles['file-navigation-row'],
          sharedStyles['file-navigation-row--flat']
        )}
        // Read-only row: it borrows the changed-file row layout but is not selectable.
        style={{ cursor: 'default' }}
      >
        <FlatFileRowContent
          status={commitFileStatusBadge(file.status)}
          name={name}
          nameTitle={nameTitle}
          directory={directoryLabel(directory)}
        />
      </div>
    </li>
  );
}
