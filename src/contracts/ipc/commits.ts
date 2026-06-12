export interface ListUnpushedCommitsRequest {
  worktreePath: string;
}

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

export interface CommitDto {
  sha: string;
  shortSha: string;
  author: string;
  /** Committer date, ISO 8601 (e.g. "2026-06-12T10:30:00+03:00"). */
  committedAt: string;
  subject: string;
  files: CommitFileChange[];
}

export interface ListUnpushedCommitsResponse {
  /** Newest commit first. Empty when nothing is unpushed (a valid success state). */
  commits: CommitDto[];
  /** True when the list was capped — more unpushed commits exist than shown. */
  truncated: boolean;
}
