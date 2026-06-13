import { beforeEach, describe, expect, it, vi } from 'vitest';

import { runGit } from '../git/runGit';
import { ChokidarRepoWatcher } from './ChokidarRepoWatcher';
import { startRecursiveWatch, type StopRecursiveWatch } from './recursiveWatch';

vi.mock('../git/runGit', () => ({ runGit: vi.fn() }));
vi.mock('./recursiveWatch', () => ({ startRecursiveWatch: vi.fn() }));

describe('ChokidarRepoWatcher', () => {
  beforeEach(() => {
    vi.mocked(runGit).mockReset();
    vi.mocked(startRecursiveWatch).mockReset();
  });

  it('watches every unique worktree root plus the shared git directory', async () => {
    const stops = Array.from({ length: 3 }, () => vi.fn<StopRecursiveWatch>(async () => {}));
    let stopIndex = 0;
    vi.mocked(runGit).mockResolvedValue('/repo/.git\n');
    vi.mocked(startRecursiveWatch).mockImplementation(async () => stops[stopIndex++]);

    const handle = new ChokidarRepoWatcher().watch(
      {
        repoPath: '/repo',
        worktreePaths: ['/repo', '/linked', '/linked'],
      },
      () => {}
    );

    await vi.waitFor(() => expect(startRecursiveWatch).toHaveBeenCalledTimes(3));
    expect(vi.mocked(startRecursiveWatch).mock.calls.map(([path]) => path)).toEqual([
      '/repo',
      '/linked',
      '/repo/.git',
    ]);

    await handle.stop();
    for (const stop of stops) {
      expect(stop).toHaveBeenCalledTimes(1);
    }
  });

  it('keeps working-tree watchers and never throws when git-dir resolution fails', async () => {
    const stop = vi.fn<StopRecursiveWatch>(async () => {});
    // The shared git-dir resolution (rev-parse) fails; auto-refresh is best-effort
    // and must not take down the main process (CLAUDE.md / git-notes.md).
    vi.mocked(runGit).mockRejectedValue(new Error('not a git repository'));
    vi.mocked(startRecursiveWatch).mockResolvedValue(stop);

    const handle = new ChokidarRepoWatcher().watch(
      { repoPath: '/repo', worktreePaths: ['/repo', '/linked'] },
      () => {}
    );

    // The working trees are still watched even though the git dir could not resolve…
    await vi.waitFor(() =>
      expect(vi.mocked(startRecursiveWatch).mock.calls.map(([path]) => path)).toEqual([
        '/repo',
        '/linked',
      ])
    );

    // …and the rejected resolution is swallowed, so stop() resolves cleanly.
    await expect(handle.stop()).resolves.toBeUndefined();
  });
});
