import type { WorktreeDto, WorktreeSummaryDto } from '../../../../../contracts/ipc';

export type WorktreeRowProps = {
  worktree: WorktreeDto;
  selected: boolean;
  summary: WorktreeSummaryDto | null;
  onSelect: (worktreePath: string) => void;
};
