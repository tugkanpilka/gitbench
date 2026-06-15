import type {
  CommitFileChange,
  CommitFileChangeStatus,
  UnpushedCommit,
} from '../../../application/worktrees/commits';

// Control-character separators embedded via git's `--format=%x1e/%x1f`. Git does NOT
// strip these bytes from metadata (a crafted subject can contain them), so each record
// is additionally validated by its full-sha header — invalid records are dropped.
const RECORD_SEP = '\x1e'; // starts each commit's record
const FIELD_SEP = '\x1f'; // between metadata fields

const FULL_SHA = /^[0-9a-f]{40}$/;

/**
 * Builds the git log invocation's `--format` value: one record per commit, fields
 * NUL-class-separated. Paired with `--name-status`, which appends `STATUS\tpath`
 * lines after the header. Keep this in sync with {@link parseCommitLog}.
 */
export const COMMIT_LOG_FORMAT = `%x1e%H%x1f%h%x1f%an%x1f%cI%x1f%s`;

function parseFileChanges(lines: string[]): CommitFileChange[] {
  const files: CommitFileChange[] = [];
  for (const line of lines) {
    if (line.length === 0 || !line.includes('\t')) continue;
    files.push(parseNameStatusLine(line));
  }
  return files;
}

function parseCommitRecord(record: string): UnpushedCommit | null {
  if (record.trim().length === 0) return null;
  const lines = record.split('\n');
  const [sha, shortSha, author, committedAt, subject] = lines[0].split(FIELD_SEP);
  if (sha === undefined || !FULL_SHA.test(sha)) return null;
  return {
    sha,
    shortSha: shortSha ?? '',
    author: author ?? '',
    committedAt: committedAt ?? '',
    subject: subject ?? '',
    files: parseFileChanges(lines.slice(1)),
  };
}

/**
 * Pure parser for `git log --name-status --format=COMMIT_LOG_FORMAT` output.
 * Tolerates merge/empty commits (no file lines). Paths containing literal tabs or
 * newlines are out of scope (see agent_docs/git-notes.md) and may parse oddly.
 */
export function parseCommitLog(stdout: string): UnpushedCommit[] {
  const commits: UnpushedCommit[] = [];
  for (const record of stdout.split(RECORD_SEP)) {
    const commit = parseCommitRecord(record);
    if (commit !== null) commits.push(commit);
  }
  return commits;
}

function parseNameStatusLine(line: string): CommitFileChange {
  const parts = line.split('\t');
  const letter = parts[0]?.[0] ?? '';

  // Renames (Rxxx) and copies (Cxxx) carry a similarity score and two paths.
  if (letter === 'R') {
    return { status: 'renamed', path: parts[2] ?? '', previousPath: parts[1] ?? null };
  }
  if (letter === 'C') {
    return { status: 'copied', path: parts[2] ?? '', previousPath: parts[1] ?? null };
  }

  return { status: statusFromLetter(letter), path: parts[1] ?? '', previousPath: null };
}

const STATUS_BY_LETTER: Record<string, CommitFileChangeStatus> = {
  A: 'added',
  M: 'modified',
  D: 'deleted',
  T: 'typeChanged',
  U: 'unmerged',
};

function statusFromLetter(letter: string): CommitFileChangeStatus {
  return STATUS_BY_LETTER[letter] ?? 'unknown';
}
