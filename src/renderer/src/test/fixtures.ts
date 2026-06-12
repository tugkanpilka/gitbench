import { vi } from 'vitest';

import type { ErrorDto, Result, WorktreeDto, WorktreeSummaryDto } from '../../../contracts/ipc';

export const okResult = <T>(data: T): Result<T> => ({ ok: true, data });

export const failResult = <T>(code: ErrorDto['code'], message: string): Result<T> => ({
  ok: false,
  error: { code, message },
});

export const MAIN_WORKTREE: WorktreeDto = {
  path: '/repo',
  branch: 'main',
  headSha: 'a'.repeat(40),
  isMain: true,
  isLocked: false,
};

export const FEATURE_WORKTREE: WorktreeDto = {
  path: '/repo-feature',
  branch: 'feature/login',
  headSha: 'b'.repeat(40),
  isMain: false,
  isLocked: false,
};

export const MAIN_WORKTREE_SUMMARY: WorktreeSummaryDto = {
  worktreePath: MAIN_WORKTREE.path,
  fileCount: 0,
  additions: 0,
  deletions: 0,
  conflictCount: 0,
  unpushedCount: 0,
  behindCount: 0,
};

export const FEATURE_WORKTREE_SUMMARY: WorktreeSummaryDto = {
  worktreePath: FEATURE_WORKTREE.path,
  fileCount: 6,
  additions: 124,
  deletions: 18,
  conflictCount: 0,
  unpushedCount: 2,
  behindCount: 1,
};

export function makeWorktree(overrides: Partial<WorktreeDto> = {}): WorktreeDto {
  return { ...MAIN_WORKTREE, ...overrides };
}

export const SAMPLE_DIFF = `diff --git a/file.txt b/file.txt
index 0000000..1111111 100644
--- a/file.txt
+++ b/file.txt
@@ -1 +1,2 @@
 hello
+world
`;

export function stubApi(overrides: Partial<Window['api']> = {}): void {
  window.api = {
    pickRepo: vi.fn().mockResolvedValue(okResult<string | null>('/repo')),
    listWorktrees: vi.fn().mockResolvedValue(okResult([MAIN_WORKTREE, FEATURE_WORKTREE])),
    listWorktreeSummaries: vi
      .fn()
      .mockResolvedValue(okResult([MAIN_WORKTREE_SUMMARY, FEATURE_WORKTREE_SUMMARY])),
    getDiff: vi.fn().mockResolvedValue(okResult({ diffText: 'diff' })),
    listUnpushedCommits: vi.fn().mockResolvedValue(okResult({ commits: [], truncated: false })),
    startWatch: vi.fn().mockResolvedValue(okResult(null)),
    stopWatch: vi.fn().mockResolvedValue(okResult(null)),
    onRepoChanged: vi.fn().mockReturnValue(() => {}),
    ...overrides,
  };
}

export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

export function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
