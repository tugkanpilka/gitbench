import { describe, expect, it } from 'vitest';

import { parseWorktreeListPorcelain } from './porcelainParser';

const SHA_A = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const SHA_B = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

function mainOnlyFixture(): string {
  return `worktree /Users/dev/repo\nHEAD ${SHA_A}\nbranch refs/heads/main\n`;
}

function twoWorktreeFixture(): string {
  return (
    `worktree /Users/dev/repo\nHEAD ${SHA_A}\nbranch refs/heads/main\n\n` +
    `worktree /Users/dev/repo-feature\nHEAD ${SHA_B}\nbranch refs/heads/feature/login\n`
  );
}

function detachedFixture(): string {
  return (
    `worktree /Users/dev/repo\nHEAD ${SHA_A}\nbranch refs/heads/main\n\n` +
    `worktree /Users/dev/repo-detached\nHEAD ${SHA_B}\ndetached\n`
  );
}

function bareMainFixture(): string {
  return (
    `worktree /Users/dev/bare-repo\nbare\n\n` +
    `worktree /Users/dev/repo-feature\nHEAD ${SHA_B}\nbranch refs/heads/feature/login\n`
  );
}

function prunableFixture(): string {
  return (
    `worktree /Users/dev/repo\nHEAD ${SHA_A}\nbranch refs/heads/main\n\n` +
    `worktree /Users/dev/repo-stale\nHEAD ${SHA_B}\nbranch refs/heads/stale\nprunable gitdir file points to non-existent location\n`
  );
}

// eslint-disable-next-line max-lines-per-function
describe('parseWorktreeListPorcelain', () => {
  it('parses a single main worktree', () => {
    expect(parseWorktreeListPorcelain(mainOnlyFixture())).toEqual([
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
    const worktrees = parseWorktreeListPorcelain(twoWorktreeFixture());
    expect(worktrees).toHaveLength(2);
    expect(worktrees[0]).toMatchObject({ path: '/Users/dev/repo', isMain: true, branch: 'main' });
    expect(worktrees[1]).toMatchObject({
      path: '/Users/dev/repo-feature',
      isMain: false,
      branch: 'feature/login',
    });
  });

  it('maps detached HEAD to branch: null', () => {
    expect(parseWorktreeListPorcelain(detachedFixture())[1]).toMatchObject({
      path: '/Users/dev/repo-detached',
      branch: null,
      headSha: SHA_B,
    });
  });

  it('parses locked without a reason', () => {
    const fixture = `worktree /Users/dev/repo\nHEAD ${SHA_A}\nbranch refs/heads/main\nlocked\n`;
    expect(parseWorktreeListPorcelain(fixture)[0]).toMatchObject({ isLocked: true });
  });

  it('parses locked with a reason on the same line', () => {
    const fixture = `worktree /Users/dev/repo\nHEAD ${SHA_A}\nbranch refs/heads/main\nlocked working tree is on a portable device\n`;
    expect(parseWorktreeListPorcelain(fixture)[0]).toMatchObject({ isLocked: true });
  });

  it('tolerates a bare main worktree carrying only the bare attribute', () => {
    const worktrees = parseWorktreeListPorcelain(bareMainFixture());
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
    const worktrees = parseWorktreeListPorcelain(prunableFixture());
    expect(worktrees).toHaveLength(2);
    expect(worktrees[1]).toMatchObject({ path: '/Users/dev/repo-stale', branch: 'stale' });
  });

  it('returns an empty list for empty output', () => {
    expect(parseWorktreeListPorcelain('')).toEqual([]);
  });
});
