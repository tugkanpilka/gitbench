import { describe, expect, it } from 'vitest';

import type { ParsedWorktree } from '../../../infrastructure/git/parsers/porcelainParser';
import { toWorktreeDto } from './worktreeMapper';

function buildParsedWorktreeFixture(): ParsedWorktree {
  return {
    path: '/tmp/repo/feature-a',
    branch: 'feature-a',
    headSha: 'abc123def456',
    isMain: false,
    isLocked: true,
  };
}

 
describe('toWorktreeDto', () => {
  it('produces exactly the five contract fields and nothing else — reader entities never cross IPC (hard rule #4)', () => {
    const worktree = buildParsedWorktreeFixture();

    // toEqual on a full literal is the tripwire: a future reader field leaking
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
