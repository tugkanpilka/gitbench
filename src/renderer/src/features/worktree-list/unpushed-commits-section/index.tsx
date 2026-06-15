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
    byStatus.set(file.status, [...(byStatus.get(file.status) ?? []), file]);
  }
  return GROUP_ORDER.filter((s) => byStatus.has(s)).map((s) => ({
    status: s,
    meta: STATUS_META[s],
    files: byStatus.get(s) ?? [],
  }));
}

// eslint-disable-next-line max-lines-per-function -- pure JSX commit list items; inline type definition inflates count
function CommitListItems({
  commits,
  expandedCommits,
  onToggle,
}: {
  commits: CommitDto[];
  expandedCommits: Set<string>;
  onToggle: (sha: string) => void;
}) {
  return (
    <ul className={styles['unpushed-commits__list']}>
      {commits.map((commit) => (
        <CommitItem
          key={commit.sha}
          commit={commit}
          expanded={expandedCommits.has(commit.sha)}
          onToggle={() => onToggle(commit.sha)}
        />
      ))}
    </ul>
  );
}

// eslint-disable-next-line max-lines-per-function -- pure JSX commit list with Visibility; inline type definition inflates count
function CommitList({
  commits,
  expandedCommits,
  onToggle,
  truncated,
}: {
  commits: CommitDto[];
  expandedCommits: Set<string>;
  onToggle: (sha: string) => void;
  truncated: boolean;
}) {
  return (
    <div className={styles['unpushed-commits__content']}>
      <CommitListItems commits={commits} expandedCommits={expandedCommits} onToggle={onToggle} />
      <Visibility isVisible={truncated}>
        <p className={styles['unpushed-commits__truncated']}>
          Showing the latest {commits.length} commits.
        </p>
      </Visibility>
    </div>
  );
}

// eslint-disable-next-line max-lines-per-function -- pure JSX section header button with Chevron; inline type definition inflates count
function SectionHeader({
  countLabel,
  expanded,
  onToggle,
}: {
  countLabel: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={styles['unpushed-commits__header']}
      onClick={onToggle}
      aria-expanded={expanded}
    >
      <span className={styles['unpushed-commits__label']}>Unpushed</span>
      <span className={styles['unpushed-commits__count']}>{countLabel}</span>
      <Chevron collapsed={!expanded} className={styles['unpushed-commits__chevron']} />
    </button>
  );
}

// eslint-disable-next-line max-lines-per-function -- top-level section; decomposed into SectionHeader/CommitList; Prettier multi-prop formatting inflates count
export function UnpushedCommitsSection({ commits, truncated }: UnpushedCommitsSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(() => new Set());
  const countLabel = truncated ? `${commits.length}+` : String(commits.length);
  const onToggle = (sha: string) => setExpandedCommits((c) => toggledSet(c, sha));
  return (
    <section className={styles['unpushed-commits']} aria-label="Unpushed commits">
      <SectionHeader
        countLabel={countLabel}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />
      <Visibility isVisible={expanded}>
        <CommitList
          commits={commits}
          expandedCommits={expandedCommits}
          onToggle={onToggle}
          truncated={truncated}
        />
      </Visibility>
    </section>
  );
}

// eslint-disable-next-line max-lines-per-function -- pure JSX commit header button with multi-span layout; inline type definition inflates count
function CommitHeader({
  commit,
  expanded,
  onToggle,
}: {
  commit: CommitDto;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
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
  );
}

// eslint-disable-next-line max-lines-per-function -- pure JSX commit item with Visibility; inline type definition inflates count
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
      <CommitHeader commit={commit} expanded={expanded} onToggle={onToggle} />
      <Visibility isVisible={expanded}>
        {groups.map((group) => (
          <FileGroupView key={group.status} group={group} />
        ))}
      </Visibility>
    </li>
  );
}

function GroupLabel({ label, tone, count }: { label: string; tone: Tone; count: number }) {
  return (
    <span className={cx(styles['commit-group__label'], styles[`commit-group__label--${tone}`])}>
      {label}
      <span className={styles['commit-group__count']}>{count}</span>
    </span>
  );
}

function FileGroupView({ group }: { group: FileGroup }) {
  return (
    <div className={styles['commit-group']}>
      <GroupLabel label={group.meta.group} tone={group.meta.tone} count={group.files.length} />
      <ul className={styles['commit-group__files']}>
        {group.files.map((file, i) => (
          <CommitFileRow key={`${file.path}:${i}`} file={file} />
        ))}
      </ul>
    </div>
  );
}

// eslint-disable-next-line max-lines-per-function -- pure JSX read-only file row with cx multi-class; Prettier multi-prop formatting inflates count
function ReadOnlyFileRow({ file }: { file: CommitFileChange }) {
  const { directory, name } = splitPath(file.path);
  const nameTitle = file.previousPath !== null ? `${file.previousPath} → ${file.path}` : file.path;
  return (
    <div
      className={cx(sharedStyles['file-navigation-row'], sharedStyles['file-navigation-row--flat'])}
      style={{ cursor: 'default' }}
    >
      <FlatFileRowContent
        status={commitFileStatusBadge(file.status)}
        name={name}
        nameTitle={nameTitle}
        directory={directoryLabel(directory)}
      />
    </div>
  );
}

function CommitFileRow({ file }: { file: CommitFileChange }) {
  return (
    <li>
      <ReadOnlyFileRow file={file} />
    </li>
  );
}
