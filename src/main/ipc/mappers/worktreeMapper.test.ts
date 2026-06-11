import { describe, expect, it } from 'vitest';

import type { Worktree } from '../../../domain/worktree/Worktree';
import { toWorktreeDto } from './worktreeMapper';

describe('toWorktreeDto', () => {
  it('produces exactly the five contract fields and nothing else — domain entities never cross IPC (hard rule #4)', () => {
    const worktree: Worktree = {
      path: '/tmp/repo/feature-a',
      branch: 'feature-a',
      headSha: 'abc123def456',
      isMain: false,
      isLocked: true,
    };

    // toEqual on a full literal is the tripwire: a future domain field leaking
    // into the DTO makes this fail.
    expect(toWorktreeDto(worktree)).toEqual({
      path: '/tmp/repo/feature-a',
      branch: 'feature-a',
      headSha: 'abc123def456',
      isMain: false,
      isLocked: true,
    });
  });
});
