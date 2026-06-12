// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  failResult,
  FEATURE_WORKTREE_SUMMARY,
  MAIN_WORKTREE,
  MAIN_WORKTREE_SUMMARY,
  okResult,
  stubApi,
} from '../../test/fixtures';
import { ApiError } from './ApiError';
import { desktopApi } from './desktopApi';

function stubDesktopApi(overrides: Partial<Window['api']> = {}): void {
  stubApi({ listWorktrees: vi.fn().mockResolvedValue(okResult([MAIN_WORKTREE])), ...overrides });
}

describe('desktopApi', () => {
  beforeEach(() => {
    stubDesktopApi();
  });

  it('returns ok:true data verbatim', async () => {
    expect(await desktopApi.pickRepo()).toBe('/repo');
    expect(await desktopApi.listWorktrees('/repo')).toEqual([MAIN_WORKTREE]);
    expect(await desktopApi.listWorktreeSummaries(['/repo'])).toEqual([
      MAIN_WORKTREE_SUMMARY,
      FEATURE_WORKTREE_SUMMARY,
    ]);
    expect(await desktopApi.getDiff('/repo')).toEqual({ diffText: 'diff' });
  });

  it('treats a cancelled picker dialog (null) as success, not an error', async () => {
    stubDesktopApi({ pickRepo: vi.fn().mockResolvedValue(okResult<string | null>(null)) });

    expect(await desktopApi.pickRepo()).toBeNull();
  });

  it("treats an empty diff ('' = clean worktree) as success, not an error", async () => {
    stubDesktopApi({ getDiff: vi.fn().mockResolvedValue(okResult({ diffText: '' })) });

    expect(await desktopApi.getDiff('/repo')).toEqual({ diffText: '' });
  });

  it('throws ApiError preserving the envelope code and message for ok:false', async () => {
    stubDesktopApi({
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
    await desktopApi.listWorktreeSummaries(['/repo', '/repo-feature']);
    await desktopApi.getDiff('/repo-feature');

    expect(window.api.pickRepo).toHaveBeenCalledWith();
    expect(window.api.listWorktrees).toHaveBeenCalledWith('/repo');
    expect(window.api.listWorktreeSummaries).toHaveBeenCalledWith(['/repo', '/repo-feature']);
    expect(window.api.getDiff).toHaveBeenCalledWith('/repo-feature');
  });
});
