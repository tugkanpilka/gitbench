import type { RecentRepoDto } from '../../../../contracts/ipc';
import gitbenchIcon from '../../assets/gitbench-icon.svg';
import { Badge } from '../../shared/ui/badge';
import { Match, Switch } from '../../shared/ui/switch';
import { Visibility } from '../../shared/ui/visibility';
import { nameFromPath } from '../../shared/path/nameFromPath';
import styles from './index.module.scss';

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  if (diffH < 48) return 'yesterday';
  return `${Math.floor(diffH / 24)}d ago`;
}

function shortenPath(repoPath: string): string {
  const home = repoPath.match(/^\/Users\/[^/]+/)?.[0] ?? null;
  if (home === null) return repoPath;
  return repoPath.replace(home, '~');
}

interface RecentRepoRowProps {
  repo: RecentRepoDto;
  onOpen: (repoPath: string) => void;
}

// eslint-disable-next-line max-lines-per-function -- JSX row with icon, two-line info, badge + time meta; no meaningful sub-view to extract
function RecentRepoRow({ repo, onOpen }: RecentRepoRowProps) {
  return (
    <li className={styles['recent-list__item']}>
      <button
        type="button"
        aria-label={nameFromPath(repo.repoPath)}
        className={styles['recent-row']}
        onClick={() => onOpen(repo.repoPath)}
      >
        <img
          className={styles['recent-row__icon']}
          src={gitbenchIcon}
          width="28"
          height="28"
          alt=""
        />
        <span className={styles['recent-row__info']}>
          <span className={styles['recent-row__name']}>{nameFromPath(repo.repoPath)}</span>
          <span className={styles['recent-row__path']}>{shortenPath(repo.repoPath)}</span>
        </span>
        <span className={styles['recent-row__meta']}>
          <Visibility isVisible={repo.worktreeCount !== null}>
            <Badge>{repo.worktreeCount} wt</Badge>
          </Visibility>
          <span className={styles['recent-row__time']}>{formatRelativeTime(repo.openedAt)}</span>
        </span>
      </button>
    </li>
  );
}

export interface RecentRepoListProps {
  repos: RecentRepoDto[];
  loading: boolean;
  onOpen: (repoPath: string) => void;
}

// eslint-disable-next-line max-lines-per-function -- JSX panel with header, list, empty-state, and drag hint; no meaningful sub-view to extract
export function RecentRepoList({ repos, loading, onOpen }: RecentRepoListProps) {
  return (
    <div className={styles['recent-panel']}>
      <p className={styles['recent-panel__header']}>Recent</p>
      <Switch>
        <Match when={loading}>
          <div className={styles['recent-panel__empty']} aria-busy="true" />
        </Match>
        <Match when={repos.length === 0}>
          <p className={styles['recent-panel__empty']}>No recent repositories.</p>
        </Match>
        <Match when={true}>
          <ul className={styles['recent-list']}>
            {repos.map((repo) => (
              <RecentRepoRow key={repo.repoPath} repo={repo} onOpen={onOpen} />
            ))}
          </ul>
        </Match>
      </Switch>
      <p className={styles['recent-panel__drag-hint']}>or drop a folder here</p>
    </div>
  );
}
