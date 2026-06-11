import type { WorktreeDto } from '../../../../../contracts/ipc';

export type TProps = {
  worktree: WorktreeDto;
  selected: boolean;
  fileCount: number | null;
  onSelect: (worktreePath: string) => void;
};
