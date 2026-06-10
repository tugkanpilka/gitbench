import { describe, expect, it } from 'vitest';

import type { Worktree } from '../../../domain/worktree/Worktree';
import type { WorktreeReader } from '../ports/WorktreeReader';
import { makeListWorktrees } from './listWorktrees';

describe('listWorktrees use case', () => {
  it('delegates to the reader port and returns its entities', async () => {
    const canned: Worktree[] = [
      { path: '/repo', branch: 'main', headSha: 'a'.repeat(40), isMain: true, isLocked: false },
    ];
    const calls: string[] = [];
    const fakeReader: WorktreeReader = {
      listWorktrees: async (repoPath) => {
        calls.push(repoPath);
        return canned;
      },
    };

    const listWorktrees = makeListWorktrees(fakeReader);

    await expect(listWorktrees('/repo')).resolves.toEqual(canned);
    expect(calls).toEqual(['/repo']);
  });

  it('propagates reader failures untouched', async () => {
    const failure = new Error('boom');
    const fakeReader: WorktreeReader = {
      listWorktrees: async () => {
        throw failure;
      },
    };

    await expect(makeListWorktrees(fakeReader)('/repo')).rejects.toBe(failure);
  });
});
