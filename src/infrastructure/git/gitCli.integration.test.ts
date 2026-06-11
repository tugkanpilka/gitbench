import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { NotARepositoryError } from '../../application/worktrees/errors/NotARepositoryError';
import { WorktreeNotFoundError } from '../../application/worktrees/errors/WorktreeNotFoundError';
import { GitCommandFailedError } from './errors/GitCommandFailedError';
import { GitCliDiffReader } from './readers/GitCliDiffReader';
import { GitCliWorktreeReader } from './readers/GitCliWorktreeReader';

function gitAvailable(): boolean {
  try {
    execFileSync('git', ['--version'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function git(repoPath: string, ...args: string[]): void {
  execFileSync(
    'git',
    [
      '-C',
      repoPath,
      '-c',
      'user.name=Test',
      '-c',
      'user.email=test@example.com',
      '-c',
      'commit.gpgsign=false',
      ...args,
    ],
    { stdio: 'pipe' }
  );
}

describe.skipIf(!gitAvailable())('git CLI readers (integration)', () => {
  const worktreeReader = new GitCliWorktreeReader();
  const diffReader = new GitCliDiffReader();

  let root: string;
  let repo: string;
  let linked: string;

  beforeAll(() => {
    // realpath: macOS tmpdir is a symlink (/var → /private/var) and git reports resolved paths
    root = realpathSync(mkdtempSync(join(tmpdir(), 'gitbench-test-')));
    repo = join(root, 'repo');
    linked = join(root, 'linked');

    mkdirSync(repo);
    git(repo, 'init', '-b', 'main');
    writeFileSync(join(repo, 'file.txt'), 'hello\n');
    git(repo, 'add', '.');
    git(repo, 'commit', '-m', 'initial');
    git(repo, 'worktree', 'add', linked, '-b', 'feature');
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  // Restore the shared fixture even when an assertion fails, so no test can
  // poison the ones after it (e.g. the clean-worktree case).
  afterEach(() => {
    git(repo, 'reset', '--hard');
    git(repo, 'clean', '-fd');
  });

  it('lists main and linked worktrees with branches', async () => {
    const worktrees = await worktreeReader.listWorktrees(repo);

    expect(worktrees).toHaveLength(2);
    expect(worktrees[0]).toMatchObject({ path: repo, isMain: true, branch: 'main' });
    expect(worktrees[1]).toMatchObject({ path: linked, isMain: false, branch: 'feature' });
    expect(worktrees[0].headSha).toMatch(/^[0-9a-f]{40}$/);
  });

  it('lists all worktrees when asked from a linked worktree', async () => {
    const worktrees = await worktreeReader.listWorktrees(linked);

    expect(worktrees).toHaveLength(2);
    expect(worktrees[0].isMain).toBe(true);
  });

  it('returns "" for a clean worktree', async () => {
    await expect(diffReader.getUncommittedDiff(repo)).resolves.toBe('');
  });

  it('returns a unified diff for modified tracked files', async () => {
    writeFileSync(join(repo, 'file.txt'), 'hello\nworld\n');

    const diff = await diffReader.getUncommittedDiff(repo);

    expect(diff).toContain('diff --git');
    expect(diff).toContain('+world');
  });

  it('includes staged changes (diff against HEAD, not the index)', async () => {
    writeFileSync(join(repo, 'staged.txt'), 'staged content\n');
    git(repo, 'add', 'staged.txt');

    const diff = await diffReader.getUncommittedDiff(repo);

    expect(diff).toContain('staged.txt');
    expect(diff).toContain('+staged content');
  });

  it('throws NotARepositoryError for a plain directory', async () => {
    const plain = join(root, 'plain');
    mkdirSync(plain);

    await expect(worktreeReader.listWorktrees(plain)).rejects.toBeInstanceOf(NotARepositoryError);
  });

  it('throws WorktreeNotFoundError for a removed path', async () => {
    await expect(diffReader.getUncommittedDiff(join(root, 'gone'))).rejects.toBeInstanceOf(
      WorktreeNotFoundError
    );
  });

  it('reports an unborn HEAD as "no commits yet", not a fake empty diff', async () => {
    const unborn = join(root, 'unborn');
    mkdirSync(unborn);
    git(unborn, 'init', '-b', 'main');

    const rejection = expect(diffReader.getUncommittedDiff(unborn)).rejects;

    await rejection.toBeInstanceOf(GitCommandFailedError);
    await rejection.toThrow('Repository has no commits yet.');
  });
});
