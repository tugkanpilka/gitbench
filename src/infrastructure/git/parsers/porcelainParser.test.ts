import { describe, expect, it } from 'vitest';

import { parseWorktreeListPorcelain } from './porcelainParser';

const SHA_A = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const SHA_B = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

describe('parseWorktreeListPorcelain', () => {
  it('parses a single main worktree', () => {
    const fixture = `worktree /Users/dev/repo
HEAD ${SHA_A}
branch refs/heads/main
`;
    expect(parseWorktreeListPorcelain(fixture)).toEqual([
      {
        path: '/Users/dev/repo',
        headSha: SHA_A,
        branch: 'main',
        isMain: true,
        isLocked: false,
      },
    ]);
  });

  it('parses multiple worktrees — only the first is main', () => {
    const fixture = `worktree /Users/dev/repo
HEAD ${SHA_A}
branch refs/heads/main

worktree /Users/dev/repo-feature
HEAD ${SHA_B}
branch refs/heads/feature/login
`;
    const worktrees = parseWorktreeListPorcelain(fixture);
    expect(worktrees).toHaveLength(2);
    expect(worktrees[0]).toMatchObject({ path: '/Users/dev/repo', isMain: true, branch: 'main' });
    expect(worktrees[1]).toMatchObject({
      path: '/Users/dev/repo-feature',
      isMain: false,
      branch: 'feature/login',
    });
  });

  it('maps detached HEAD to branch: null', () => {
    const fixture = `worktree /Users/dev/repo
HEAD ${SHA_A}
branch refs/heads/main

worktree /Users/dev/repo-detached
HEAD ${SHA_B}
detached
`;
    expect(parseWorktreeListPorcelain(fixture)[1]).toMatchObject({
      path: '/Users/dev/repo-detached',
      branch: null,
      headSha: SHA_B,
    });
  });

  it('parses locked without a reason', () => {
    const fixture = `worktree /Users/dev/repo
HEAD ${SHA_A}
branch refs/heads/main
locked
`;
    expect(parseWorktreeListPorcelain(fixture)[0]).toMatchObject({ isLocked: true });
  });

  it('parses locked with a reason on the same line', () => {
    const fixture = `worktree /Users/dev/repo
HEAD ${SHA_A}
branch refs/heads/main
locked working tree is on a portable device
`;
    expect(parseWorktreeListPorcelain(fixture)[0]).toMatchObject({ isLocked: true });
  });

  it('tolerates a bare main worktree carrying only the bare attribute', () => {
    const fixture = `worktree /Users/dev/bare-repo
bare

worktree /Users/dev/repo-feature
HEAD ${SHA_B}
branch refs/heads/feature/login
`;
    const worktrees = parseWorktreeListPorcelain(fixture);
    expect(worktrees[0]).toEqual({
      path: '/Users/dev/bare-repo',
      headSha: '',
      branch: null,
      isMain: true,
      isLocked: false,
    });
    expect(worktrees[1]).toMatchObject({ isMain: false, branch: 'feature/login' });
  });

  it('ignores prunable lines', () => {
    const fixture = `worktree /Users/dev/repo
HEAD ${SHA_A}
branch refs/heads/main

worktree /Users/dev/repo-stale
HEAD ${SHA_B}
branch refs/heads/stale
prunable gitdir file points to non-existent location
`;
    const worktrees = parseWorktreeListPorcelain(fixture);
    expect(worktrees).toHaveLength(2);
    expect(worktrees[1]).toMatchObject({ path: '/Users/dev/repo-stale', branch: 'stale' });
  });

  it('returns an empty list for empty output', () => {
    expect(parseWorktreeListPorcelain('')).toEqual([]);
  });
});
