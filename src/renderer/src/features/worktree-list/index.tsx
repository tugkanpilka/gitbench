import { ChangedFilesSection } from './changed-files-section';
import { FileListProvider } from './file-list-context';
import { UnpushedCommitsSection } from './unpushed-commits-section';
import { WorktreeRow } from './worktree-row';
import type { WorktreeListProps } from './index.types';
import styles from './index.module.scss';

// CLAUDE.md: "The sidebar should present worktrees as a simple, flat list. We don't
// attempt to group by branch or nest them, even if branch names share prefixes. This
// avoids the complexity of a tree view and ensures users can always see all worktrees."

export function WorktreeList({
  worktrees,
  selectedPath,
  changedFiles,
  unpushedCommits,
  commitsTruncated,
  fileListMode,
  activeFileId,
  diffStats,
  onSelect,
  onSelectFile,
}: WorktreeListProps) {
  if (worktrees.length === 0) {
    return (
      <p className={styles['worktree-list__empty']}>No worktrees to display in this repository.</p>
    );
  }

  return (
    <div className={styles['worktree-list-container']}>
      <ul className={styles['worktree-list']} aria-label="Worktrees">
        {worktrees.map((worktree) => {
          const selected = worktree.path === selectedPath;
          const fileCount = selected ? changedFiles.length : null;

          return (
            <li key={worktree.path}>
              <WorktreeRow
                worktree={worktree}
                selected={selected}
                fileCount={fileCount}
                onSelect={onSelect}
              />
              {selected && fileCount !== null && fileCount > 0 && (
                <FileListProvider
                  files={changedFiles}
                  activeFileId={activeFileId}
                  onSelectFile={onSelectFile}
                >
                  <ChangedFilesSection
                    changedFiles={changedFiles}
                    fileListMode={fileListMode}
                    diffStats={diffStats}
                  />
                </FileListProvider>
              )}
              {selected && unpushedCommits.length > 0 && (
                <UnpushedCommitsSection
                  commits={unpushedCommits}
                  truncated={commitsTruncated}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
