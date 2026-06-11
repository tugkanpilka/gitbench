// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ErrorDto, Result, WorktreeDto } from '../../../../contracts/ipc';
import { ApiError } from './ApiError';
import { desktopApi } from './desktopApi';

const okResult = <T,>(data: T): Result<T> => ({ ok: true, data });
const failResult = <T,>(code: ErrorDto['code'], message: string): Result<T> => ({
  ok: false,
  error: { code, message },
});

const MAIN_WORKTREE: WorktreeDto = {
  path: '/repo',
  branch: 'main',
  headSha: 'a'.repeat(40),
  isMain: true,
  isLocked: false,
};

function stubApi(overrides: Partial<Window['api']> = {}): void {
  window.api = {
    pickRepo: vi.fn().mockResolvedValue(okResult<string | null>('/repo')),
    listWorktrees: vi.fn().mockResolvedValue(okResult([MAIN_WORKTREE])),
    getDiff: vi.fn().mockResolvedValue(okResult({ diffText: 'diff' })),
    ...overrides,
  };
}

describe('desktopApi', () => {
  beforeEach(() => {
    stubApi();
  });

  it('returns ok:true data verbatim', async () => {
    expect(await desktopApi.pickRepo()).toBe('/repo');
    expect(await desktopApi.listWorktrees('/repo')).toEqual([MAIN_WORKTREE]);
    expect(await desktopApi.getDiff('/repo')).toEqual({ diffText: 'diff' });
  });

  it('treats a cancelled picker dialog (null) as success, not an error', async () => {
    stubApi({ pickRepo: vi.fn().mockResolvedValue(okResult<string | null>(null)) });

    expect(await desktopApi.pickRepo()).toBeNull();
  });

  it("treats an empty diff ('' = clean worktree) as success, not an error", async () => {
    stubApi({ getDiff: vi.fn().mockResolvedValue(okResult({ diffText: '' })) });

    expect(await desktopApi.getDiff('/repo')).toEqual({ diffText: '' });
  });

  it('throws ApiError preserving the envelope code and message for ok:false', async () => {
    stubApi({
      listWorktrees: vi
        .fn()
        .mockResolvedValue(failResult('NOT_A_REPOSITORY', 'Not a git repository: /repo')),
    });

    const failure = desktopApi.listWorktrees('/repo');

    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(failure).rejects.toMatchObject({
      name: 'ApiError',
      code: 'NOT_A_REPOSITORY',
      message: 'Not a git repository: /repo',
    });
  });

  it('delegates each method to the matching window.api channel with its argument', async () => {
    await desktopApi.pickRepo();
    await desktopApi.listWorktrees('/repo');
    await desktopApi.getDiff('/repo-feature');

    expect(window.api.pickRepo).toHaveBeenCalledWith();
    expect(window.api.listWorktrees).toHaveBeenCalledWith('/repo');
    expect(window.api.getDiff).toHaveBeenCalledWith('/repo-feature');
  });
});
