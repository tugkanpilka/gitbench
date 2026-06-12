import type { WorktreeDto, WorktreeSummaryDto } from '../../../../contracts/ipc';

export type WorktreeListProps = {
  worktrees: WorktreeDto[];
  summaries: WorktreeSummaryDto[];
  selectedPath: string | null;
  onSelect: (worktreePath: string) => void;
};
