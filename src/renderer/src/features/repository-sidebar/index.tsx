import { nameFromPath } from '../../shared/path/nameFromPath';
import { WorktreeList } from '../worktree-list';
import type { RepositorySidebarProps } from './index.types';
import styles from './index.module.scss';

export function RepositorySidebar({
  repoPath,
  worktrees,
  selectedPath,
  selectedFileCount,
  selectedUnpushedCount,
  onSelectWorktree,
}: RepositorySidebarProps) {
  const repositoryName = nameFromPath(repoPath);

  return (
    <div className={styles['repository-sidebar']}>
      <header className={styles['repository-sidebar__header']}>
        <span className={styles['repository-sidebar__repo-name']} title={repoPath}>
          {repositoryName}
        </span>
        <span className={styles['repository-sidebar__repo-meta']}>
          {worktrees.length} {worktrees.length === 1 ? 'worktree' : 'worktrees'}
        </span>
      </header>

      <nav className={styles['repository-sidebar__navigation']} aria-label="Worktrees">
        <header className={styles['repository-sidebar__section-header']}>
          <h2 className={styles['repository-sidebar__section-label']}>Worktrees</h2>
        </header>
        <WorktreeList
          worktrees={worktrees}
          selectedPath={selectedPath}
          selectedFileCount={selectedFileCount}
          selectedUnpushedCount={selectedUnpushedCount}
          onSelect={onSelectWorktree}
        />
      </nav>
    </div>
  );
}
