const CONFLICT_STATUSES = new Set(['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU']);

function isUntrackedStatus(status: string): boolean {
  return status === '??';
}

function isConflictStatus(status: string): boolean {
  return CONFLICT_STATUSES.has(status) || status.includes('U');
}

function consumesExtraField(status: string): boolean {
  return status.includes('R') || status.includes('C');
}

export interface WorktreeStatusSummary {
  fileCount: number;
  conflictCount: number;
  untrackedPaths: string[];
}

export interface LineStats {
  additions: number;
  deletions: number;
}

interface StatusAccumulator {
  fileCount: number;
  conflictCount: number;
  untrackedPaths: string[];
}

function accumulateStatusField(acc: StatusAccumulator, field: string): boolean {
  if (field.length < 4) return false;
  const status = field.slice(0, 2);
  acc.fileCount += 1;
  if (isUntrackedStatus(status)) acc.untrackedPaths.push(field.slice(3));
  if (isConflictStatus(status)) acc.conflictCount += 1;
  return consumesExtraField(status);
}

/**
 * Parses `git status --porcelain=v1 -z --untracked-files=all`.
 * Rename/copy records carry a second NUL-delimited source path, which is skipped.
 */
export function parseWorktreeStatus(stdout: string): WorktreeStatusSummary {
  const fields = stdout.split('\0');
  const acc: StatusAccumulator = { fileCount: 0, conflictCount: 0, untrackedPaths: [] };
  for (let index = 0; index < fields.length; index += 1) {
    const skipNext = accumulateStatusField(acc, fields[index] ?? '');
    if (skipNext) index += 1;
  }
  return acc;
}

function parseNumstatColumn(value: string | undefined): number {
  return value !== undefined && /^\d+$/.test(value) ? Number(value) : 0;
}

/** Sums the numeric columns from `git diff --numstat`; binary `-` columns count as zero. */
export function parseNumstat(stdout: string): LineStats {
  let additions = 0;
  let deletions = 0;

  for (const line of stdout.split('\n')) {
    if (line.length === 0) {
      continue;
    }
    const [added, deleted] = line.split('\t');
    additions += parseNumstatColumn(added);
    deletions += parseNumstatColumn(deleted);
  }

  return { additions, deletions };
}
