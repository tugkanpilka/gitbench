/** How a file changed in a commit, normalized from git's status letters. */
export type CommitFileChangeStatus =
  | 'added'
  | 'modified'
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'typeChanged'
  | 'unmerged'
  | 'unknown';

export interface CommitFileChange {
  status: CommitFileChangeStatus;
  /** Current path (the destination for renames/copies). */
  path: string;
  /** Source path for renames/copies; null otherwise. */
  previousPath: string | null;
}

export interface UnpushedCommit {
  sha: string;
  shortSha: string;
  author: string;
  /** Committer date, ISO 8601. */
  committedAt: string;
  subject: string;
  files: CommitFileChange[];
}

export interface UnpushedCommits {
  /** Newest commit first. Empty is a valid success state (nothing unpushed). */
  commits: UnpushedCommit[];
  /** True when the list was capped — more unpushed commits exist than returned. */
  truncated: boolean;
}

export interface CommitReader {
  /**
   * Commits on the worktree's HEAD that have not been pushed: ahead of the branch's
   * upstream when one is set, otherwise not reachable from any remote-tracking ref.
   * Empty when there is nothing unpushed (or no remote to push to) — never an error.
   */
  listUnpushedCommits(worktreePath: string): Promise<UnpushedCommits>;
}
