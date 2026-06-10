import type { DiffReader } from '../ports/DiffReader';

export function makeGetUncommittedDiff(reader: DiffReader) {
  return function getUncommittedDiff(worktreePath: string): Promise<string> {
    return reader.getUncommittedDiff(worktreePath);
  };
}
