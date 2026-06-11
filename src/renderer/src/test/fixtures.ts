import { vi } from 'vitest';

import type { ErrorDto, Result, WorktreeDto } from '../../../contracts/ipc';

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
    getDiff: vi.fn().mockResolvedValue(okResult({ diffText: 'diff' })),
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
