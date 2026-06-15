import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { NotARepositoryError } from '../../application/worktrees/errors/NotARepositoryError';
import { WorktreeNotFoundError } from '../../application/worktrees/errors/WorktreeNotFoundError';
import { GitCommandFailedError } from './errors/GitCommandFailedError';
import { GitCliCommitReader } from './readers/GitCliCommitReader';
import { GitCliDiffReader } from './readers/GitCliDiffReader';
import { GitCliWorktreeReader } from './readers/GitCliWorktreeReader';
import { GitCliWorktreeSummaryReader } from './readers/GitCliWorktreeSummaryReader';

function gitAvailable(): boolean {
  try {
    execFileSync('git', ['--version'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

const GIT_IDENT_ARGS = [
  '-c',
  'user.name=Test',
  '-c',
  'user.email=test@example.com',
  '-c',
  'commit.gpgsign=false',
];

function git(repoPath: string, ...args: string[]): void {
  execFileSync('git', ['-C', repoPath, ...GIT_IDENT_ARGS, ...args], { stdio: 'pipe' });
}

function makeUnbornRepo(root: string, name: string): string {
  const dir = join(root, name);
  mkdirSync(dir);
  git(dir, 'init', '-b', 'main');
  return dir;
}

// eslint-disable-next-line max-lines-per-function
describe.skipIf(!gitAvailable())('git CLI readers (integration)', () => {
  const worktreeReader = new GitCliWorktreeReader();
  const diffReader = new GitCliDiffReader();
  const summaryReader = new GitCliWorktreeSummaryReader();

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
    writeFileSync(join(repo, '.gitignore'), 'ignored.txt\n');
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

  it('returns a clean summary without selecting the worktree', async () => {
    await expect(summaryReader.listWorktreeSummaries([repo])).resolves.toEqual([
      {
        worktreePath: repo,
        fileCount: 0,
        additions: 0,
        deletions: 0,
        conflictCount: 0,
        unpushedCount: 0,
        behindCount: null,
      },
    ]);
  });

  it('summarizes tracked and untracked line changes', async () => {
    writeFileSync(join(repo, 'file.txt'), 'hello\nworld\n');
    writeFileSync(join(repo, 'new.txt'), 'one\ntwo\n');

    await expect(summaryReader.listWorktreeSummaries([repo])).resolves.toEqual([
      {
        worktreePath: repo,
        fileCount: 2,
        additions: 3,
        deletions: 0,
        conflictCount: 0,
        unpushedCount: 0,
        behindCount: null,
      },
    ]);
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

  it('includes deleted tracked files', async () => {
    rmSync(join(repo, 'file.txt'));

    const diff = await diffReader.getUncommittedDiff(repo);

    expect(diff).toContain('deleted file mode');
    expect(diff).toContain('--- a/file.txt');
    expect(diff).toContain('-hello');
  });

  it('includes untracked text, empty, and binary files but excludes ignored files', async () => {
    writeFileSync(join(repo, 'new.txt'), 'new content\n');
    writeFileSync(join(repo, 'empty.txt'), '');
    writeFileSync(join(repo, 'image.bin'), Buffer.from([0, 1, 2, 3]));
    writeFileSync(join(repo, 'ignored.txt'), 'ignored\n');

    const diff = await diffReader.getUncommittedDiff(repo);

    expect(diff).toContain('diff --git a/new.txt b/new.txt');
    expect(diff).toContain('+new content');
    expect(diff).toContain('diff --git a/empty.txt b/empty.txt');
    expect(diff).toContain('new file mode 100644');
    expect(diff).toContain('Binary files /dev/null and b/image.bin differ');
    expect(diff).not.toContain('ignored.txt');
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
    const unborn = makeUnbornRepo(root, 'unborn');
    const rejection = expect(diffReader.getUncommittedDiff(unborn)).rejects;

    await rejection.toBeInstanceOf(GitCommandFailedError);
    await rejection.toThrow('Repository has no commits yet.');
  });

  it('summarizes an unborn HEAD with no diff against HEAD and no push counts', async () => {
    const unborn = makeUnbornRepo(root, 'unborn-summary');
    writeFileSync(join(unborn, 'draft.txt'), 'wip\n');

    // No commit yet → `git diff HEAD` is impossible, so stats stay zero, but the
    // untracked file is still counted and ahead/behind is undefined (null behind).
    await expect(summaryReader.listWorktreeSummaries([unborn])).resolves.toEqual([
      {
        worktreePath: unborn,
        fileCount: 1,
        additions: 0,
        deletions: 0,
        conflictCount: 0,
        unpushedCount: 0,
        behindCount: null,
      },
    ]);
  });
});

/** A repo with one pushed commit on `main` and a bare remote wired as `origin`. */
function makeRepoWithRemote(root: string, name: string, options: { setUpstream: boolean }): string {
  const repo = join(root, name);
  const remote = join(root, `${name}-remote.git`);
  mkdirSync(repo);
  execFileSync('git', ['init', '--bare', remote], { stdio: 'pipe' });
  git(repo, 'init', '-b', 'main');
  writeFileSync(join(repo, 'file.txt'), 'hello\n');
  git(repo, 'add', '.');
  git(repo, 'commit', '-m', 'initial');
  git(repo, 'remote', 'add', 'origin', remote);
  git(repo, 'push', ...(options.setUpstream ? ['-u'] : []), 'origin', 'main');
  return repo;
}

function addTwoCommitsAhead(repo: string): void {
  writeFileSync(join(repo, 'file.txt'), 'hello\nworld\n');
  writeFileSync(join(repo, 'added.txt'), 'new\n');
  git(repo, 'add', '.');
  git(repo, 'commit', '-m', 'second');
  rmSync(join(repo, 'added.txt'));
  git(repo, 'add', '.');
  git(repo, 'commit', '-m', 'third');
}

type AheadResult = {
  truncated: boolean;
  commits: {
    subject: string;
    files: { status: string; path: string; previousPath: string | null }[];
    sha: string;
    shortSha: string;
  }[];
};

function assertThirdCommitFiles(commits: AheadResult['commits']): void {
  expect(commits[0].files).toEqual([{ status: 'deleted', path: 'added.txt', previousPath: null }]);
  expect(commits[0].sha).toMatch(/^[0-9a-f]{40}$/);
  expect(commits[0].shortSha).toMatch(/^[0-9a-f]{7,}$/);
}

function assertSecondCommitFiles(commits: AheadResult['commits']): void {
  expect(commits[1].files).toContainEqual({
    status: 'modified',
    path: 'file.txt',
    previousPath: null,
  });
  expect(commits[1].files).toContainEqual({
    status: 'added',
    path: 'added.txt',
    previousPath: null,
  });
}

function assertAheadCommitFiles(result: AheadResult): void {
  expect(result.truncated).toBe(false);
  expect(result.commits.map((c) => c.subject)).toEqual(['third', 'second']);
  assertThirdCommitFiles(result.commits);
  assertSecondCommitFiles(result.commits);
}

// eslint-disable-next-line max-lines-per-function
describe.skipIf(!gitAvailable())('GitCliCommitReader (integration)', () => {
  const reader = new GitCliCommitReader();
  const summaryReader = new GitCliWorktreeSummaryReader();

  let root: string;

  beforeAll(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'gitbench-commits-')));
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('returns no commits when there is no remote to push to', async () => {
    const repo = join(root, 'local-only');
    mkdirSync(repo);
    git(repo, 'init', '-b', 'main');
    writeFileSync(join(repo, 'file.txt'), 'hello\n');
    git(repo, 'add', '.');
    git(repo, 'commit', '-m', 'initial');

    await expect(reader.listUnpushedCommits(repo)).resolves.toEqual({
      commits: [],
      truncated: false,
    });
  });

  it('returns no commits when HEAD is level with its upstream', async () => {
    const repo = makeRepoWithRemote(root, 'level', { setUpstream: true });

    await expect(reader.listUnpushedCommits(repo)).resolves.toEqual({
      commits: [],
      truncated: false,
    });
  });

  it('lists commits ahead of upstream, newest first, with file statuses', async () => {
    const repo = makeRepoWithRemote(root, 'ahead', { setUpstream: true });
    addTwoCommitsAhead(repo);
    assertAheadCommitFiles(await reader.listUnpushedCommits(repo));
  });

  it('falls back to commits absent from any remote when no upstream is set', async () => {
    const repo = makeRepoWithRemote(root, 'no-upstream', { setUpstream: false });
    git(repo, 'checkout', '-b', 'feature');
    writeFileSync(join(repo, 'feature.txt'), 'x\n');
    git(repo, 'add', '.');
    git(repo, 'commit', '-m', 'feature work');

    const result = await reader.listUnpushedCommits(repo);

    expect(result.commits.map((commit) => commit.subject)).toEqual(['feature work']);
  });

  it('summarizes commits ahead of an upstream without loading commit details', async () => {
    const repo = makeRepoWithRemote(root, 'summary-ahead', { setUpstream: true });
    writeFileSync(join(repo, 'file.txt'), 'hello\nworld\n');
    git(repo, 'add', '.');
    git(repo, 'commit', '-m', 'local work');

    const [summary] = await summaryReader.listWorktreeSummaries([repo]);

    expect(summary).toMatchObject({
      worktreePath: repo,
      unpushedCount: 1,
      behindCount: 0,
    });
  });
});
