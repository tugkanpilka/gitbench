import { beforeEach, describe, expect, it, vi } from 'vitest';

import { runGit } from '../git/runGit';
import { ChokidarRepoWatcher } from './ChokidarRepoWatcher';
import { startRecursiveWatch, type StopRecursiveWatch } from './recursiveWatch';

vi.mock('../git/runGit', () => ({ runGit: vi.fn() }));
vi.mock('./recursiveWatch', () => ({ startRecursiveWatch: vi.fn() }));

function makeStopFns(count: number): ReturnType<typeof vi.fn<StopRecursiveWatch>>[] {
  return Array.from({ length: count }, () => vi.fn<StopRecursiveWatch>(async () => {}));
}

function arrangeMultipleWorktrees(): { stops: ReturnType<typeof vi.fn<StopRecursiveWatch>>[] } {
  const stops = makeStopFns(3);
  let stopIndex = 0;
  vi.mocked(runGit).mockResolvedValue('/repo/.git\n');
  vi.mocked(startRecursiveWatch).mockImplementation(async () => stops[stopIndex++]);
  return { stops };
}

function arrangeGitDirResolutionFailure(): void {
  // The shared git-dir resolution (rev-parse) fails; auto-refresh is best-effort
  // and must not take down the main process (CLAUDE.md / git-notes.md).
  vi.mocked(runGit).mockRejectedValue(new Error('not a git repository'));
  vi.mocked(startRecursiveWatch).mockResolvedValue(vi.fn<StopRecursiveWatch>(async () => {}));
}

function watchedPaths(): string[] {
  return vi.mocked(startRecursiveWatch).mock.calls.map(([path]) => path);
}

// eslint-disable-next-line max-lines-per-function
describe('ChokidarRepoWatcher', () => {
  beforeEach(() => {
    vi.mocked(runGit).mockReset();
    vi.mocked(startRecursiveWatch).mockReset();
  });

  it('watches every unique worktree root plus the shared git directory', async () => {
    const { stops } = arrangeMultipleWorktrees();
    const handle = new ChokidarRepoWatcher().watch(
      { repoPath: '/repo', worktreePaths: ['/repo', '/linked', '/linked'] },
      () => {}
    );

    await vi.waitFor(() => expect(startRecursiveWatch).toHaveBeenCalledTimes(3));
    expect(watchedPaths()).toEqual(['/repo', '/linked', '/repo/.git']);

    await handle.stop();
    for (const stop of stops) {
      expect(stop).toHaveBeenCalledTimes(1);
    }
  });

  it('keeps working-tree watchers and never throws when git-dir resolution fails', async () => {
    arrangeGitDirResolutionFailure();
    const handle = new ChokidarRepoWatcher().watch(
      { repoPath: '/repo', worktreePaths: ['/repo', '/linked'] },
      () => {}
    );

    // The working trees are still watched even though the git dir could not resolve…
    await vi.waitFor(() => expect(watchedPaths()).toEqual(['/repo', '/linked']));

    // …and the rejected resolution is swallowed, so stop() resolves cleanly.
    await expect(handle.stop()).resolves.toBeUndefined();
  });
});
