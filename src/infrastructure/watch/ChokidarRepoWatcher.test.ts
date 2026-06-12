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
});
