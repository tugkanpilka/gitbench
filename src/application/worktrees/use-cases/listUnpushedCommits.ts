import type { CommitReader, UnpushedCommits } from '../ports/CommitReader';

export function makeListUnpushedCommits(reader: CommitReader) {
  return function listUnpushedCommits(worktreePath: string): Promise<UnpushedCommits> {
    return reader.listUnpushedCommits(worktreePath);
  };
}
