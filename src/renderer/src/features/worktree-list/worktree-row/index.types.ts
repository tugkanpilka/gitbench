import type { WorktreeDto } from '../../../../../contracts/ipc';

export type WorktreeRowProps = {
  worktree: WorktreeDto;
  selected: boolean;
  fileCount: number | null;
  unpushedCount: number | null;
  onSelect: (worktreePath: string) => void;
};
