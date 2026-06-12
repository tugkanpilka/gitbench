const CONFLICT_STATUSES = new Set(['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU']);

export interface WorktreeStatusSummary {
  fileCount: number;
  conflictCount: number;
  untrackedPaths: string[];
}

export interface LineStats {
  additions: number;
  deletions: number;
}

/**
 * Parses `git status --porcelain=v1 -z --untracked-files=all`.
 * Rename/copy records carry a second NUL-delimited source path, which is skipped.
 */
export function parseWorktreeStatus(stdout: string): WorktreeStatusSummary {
  const fields = stdout.split('\0');
  const untrackedPaths: string[] = [];
  let fileCount = 0;
  let conflictCount = 0;

  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    if (field.length < 4) {
      continue;
    }

    const status = field.slice(0, 2);
    const path = field.slice(3);
    fileCount += 1;

    if (status === '??') {
      untrackedPaths.push(path);
    }
    if (CONFLICT_STATUSES.has(status) || status.includes('U')) {
      conflictCount += 1;
    }
    if (status.includes('R') || status.includes('C')) {
      index += 1;
    }
  }

  return { fileCount, conflictCount, untrackedPaths };
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
    if (added !== undefined && /^\d+$/.test(added)) {
      additions += Number(added);
    }
    if (deleted !== undefined && /^\d+$/.test(deleted)) {
      deletions += Number(deleted);
    }
  }

  return { additions, deletions };
}
