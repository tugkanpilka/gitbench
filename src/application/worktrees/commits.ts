/**
 * Canonical commit-change types shared by the infrastructure git readers/parsers and
 * the main-process mappers. They live in the application layer because both
 * infrastructure and main may depend on it, whereas infrastructure must not import
 * contracts (see agent_docs/architecture.md import matrix). The contracts copy in
 * `contracts/ipc/commits.ts` is the wire/DTO surface for the renderer; `commitMapper`
 * is the compile-time tripwire that keeps the two structurally identical.
 */

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
