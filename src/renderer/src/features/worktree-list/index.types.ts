import type { WorktreeDto } from '../../../../contracts/ipc';

export type WorktreeListProps = {
  worktrees: WorktreeDto[];
  selectedPath: string | null;
  selectedFileCount: number;
  selectedUnpushedCount: number;
  onSelect: (worktreePath: string) => void;
};
