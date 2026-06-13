import { describe, expect, it } from 'vitest';

import { parseNumstat, parseWorktreeStatus } from './worktreeSummaryParser';

describe('parseWorktreeStatus', () => {
  it('counts changed, untracked, renamed, and conflicted files', () => {
    const stdout = [
      ' M src/app.ts',
      '?? notes.txt',
      'R  src/new.ts',
      'src/old.ts',
      'UU conflicted.txt',
      '',
    ].join('\0');

    expect(parseWorktreeStatus(stdout)).toEqual({
      fileCount: 4,
      conflictCount: 1,
      untrackedPaths: ['notes.txt'],
    });
  });

  it('returns a clean summary for empty output', () => {
    expect(parseWorktreeStatus('')).toEqual({
      fileCount: 0,
      conflictCount: 0,
      untrackedPaths: [],
    });
  });
});

describe('parseNumstat', () => {
  it('sums text changes and ignores binary markers', () => {
    expect(parseNumstat('4\t2\tsrc/app.ts\n-\t-\timage.png\n1\t0\tnew.txt\n')).toEqual({
      additions: 5,
      deletions: 2,
    });
  });

  it('returns zero stats for empty output (a clean worktree)', () => {
    expect(parseNumstat('')).toEqual({ additions: 0, deletions: 0 });
  });
});
