import type { WorktreeDto, WorktreeSummaryDto } from '../../../../contracts/ipc';

export type RepositorySidebarProps = {
  repoPath: string;
  worktrees: WorktreeDto[];
  summaries: WorktreeSummaryDto[];
  selectedPath: string | null;
  onSelectWorktree: (worktreePath: string) => void;
};
