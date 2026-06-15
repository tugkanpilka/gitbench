import { nameFromPath } from '../../shared/path/nameFromPath';
import { WorktreeList } from '../worktree-list';
import type { RepositorySidebarProps } from './index.types';
import styles from './index.module.scss';

function RepoHeader({ repoPath, name }: { repoPath: string; name: string }) {
  return (
    <header className={styles['repository-sidebar__header']}>
      <span className={styles['repository-sidebar__repo-name']} title={repoPath}>
        {name}
      </span>
    </header>
  );
}

function WorktreesSectionHeader() {
  return (
    <header className={styles['repository-sidebar__section-header']}>
      <h2 className={styles['repository-sidebar__section-label']}>Worktrees</h2>
    </header>
  );
}

type WorktreesNavProps = Pick<
  RepositorySidebarProps,
  'worktrees' | 'summaries' | 'selectedPath' | 'onSelectWorktree'
>;

function WorktreesNav({ worktrees, summaries, selectedPath, onSelectWorktree }: WorktreesNavProps) {
  return (
    <nav className={styles['repository-sidebar__navigation']} aria-label="Worktrees">
      <WorktreesSectionHeader />
      <WorktreeList
        worktrees={worktrees}
        summaries={summaries}
        selectedPath={selectedPath}
        onSelect={onSelectWorktree}
      />
    </nav>
  );
}

// eslint-disable-next-line max-lines-per-function -- pure JSX render; RepoHeader and WorktreesNav are already extracted
export function RepositorySidebar({
  repoPath,
  worktrees,
  summaries,
  selectedPath,
  onSelectWorktree,
}: RepositorySidebarProps) {
  const repositoryName = nameFromPath(repoPath);

  return (
    <div className={styles['repository-sidebar']}>
      <RepoHeader repoPath={repoPath} name={repositoryName} />
      <WorktreesNav
        worktrees={worktrees}
        summaries={summaries}
        selectedPath={selectedPath}
        onSelectWorktree={onSelectWorktree}
      />
    </div>
  );
}
