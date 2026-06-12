import type { WorktreeSummary, WorktreeSummaryReader } from '../ports/WorktreeSummaryReader';

export function makeListWorktreeSummaries(reader: WorktreeSummaryReader) {
  return function listWorktreeSummaries(worktreePaths: string[]): Promise<WorktreeSummary[]> {
    return reader.listWorktreeSummaries(worktreePaths);
  };
}
