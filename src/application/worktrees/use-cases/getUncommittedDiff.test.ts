import { describe, expect, it } from 'vitest';

import type { DiffReader } from '../ports/DiffReader';
import { makeGetUncommittedDiff } from './getUncommittedDiff';

describe('getUncommittedDiff use case', () => {
  it('delegates to the diff reader port', async () => {
    const calls: string[] = [];
    const fakeReader: DiffReader = {
      getUncommittedDiff: async (worktreePath) => {
        calls.push(worktreePath);
        return 'diff --git a/x b/x';
      },
    };

    const getUncommittedDiff = makeGetUncommittedDiff(fakeReader);

    await expect(getUncommittedDiff('/wt')).resolves.toBe('diff --git a/x b/x');
    expect(calls).toEqual(['/wt']);
  });

  it('passes through "" — a clean worktree is success, not an error', async () => {
    const fakeReader: DiffReader = { getUncommittedDiff: async () => '' };

    await expect(makeGetUncommittedDiff(fakeReader)('/wt')).resolves.toBe('');
  });
});
