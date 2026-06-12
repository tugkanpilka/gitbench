import type { WorktreeDto } from '../../../../contracts/ipc';

export type RepositorySidebarProps = {
  repoPath: string;
  worktrees: WorktreeDto[];
  selectedPath: string | null;
  selectedFileCount: number;
  selectedUnpushedCount: number;
  onSelectWorktree: (worktreePath: string) => void;
};
