import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotARepositoryError } from '../../application/worktrees/errors/NotARepositoryError';
import { WorktreeNotFoundError } from '../../application/worktrees/errors/WorktreeNotFoundError';
import { GitCommandFailedError } from './errors/GitCommandFailedError';
import { GitNotInstalledError } from './errors/GitNotInstalledError';
import { runGit } from './runGit';

const execFileMock = vi.hoisted(() => vi.fn());

vi.mock('node:child_process', () => ({
  execFile: execFileMock,
}));

type ExecFileCallback = (error: Error | null, stdout: string, stderr: string) => void;

/** Makes the mocked execFile invoke its callback with the given outcome. */
function stubGitOutcome(error: Error | null, stdout = '', stderr = ''): void {
  execFileMock.mockImplementation(
    (_file: string, _args: string[], _options: object, callback: ExecFileCallback) => {
      callback(error, stdout, stderr);
    }
  );
}

describe('runGit', () => {
  beforeEach(() => {
    execFileMock.mockReset();
  });

  it('spawns git with an argument array [-C, targetPath, ...args] and a prompt-free, lock-free, LC_ALL=C environment', async () => {
    stubGitOutcome(null, 'stdout payload');

    await expect(runGit('/tmp/repo', ['diff', 'HEAD'])).resolves.toBe('stdout payload');

    const [file, args, options] = execFileMock.mock.calls[0];
    expect(file).toBe('git');
    expect(args).toEqual(['-C', '/tmp/repo', 'diff', 'HEAD']);
    expect(options.env).toMatchObject({
      GIT_TERMINAL_PROMPT: '0',
      GIT_OPTIONAL_LOCKS: '0',
      LC_ALL: 'C', // stable English stderr is what makes the classification sniffing below valid
    });
  });

  it('maps ENOENT from execFile to GitNotInstalledError', async () => {
    stubGitOutcome(Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' }));

    await expect(runGit('/tmp/repo', ['status'])).rejects.toBeInstanceOf(GitNotInstalledError);
  });

  it("classifies 'not a git repository' on stderr as NotARepositoryError carrying the target path", async () => {
    stubGitOutcome(
      Object.assign(new Error('Command failed'), { code: 128 }),
      '',
      "fatal: not a git repository (or any of the parent directories): .git\n"
    );

    await expect(runGit('/tmp/not-a-repo', ['status'])).rejects.toThrowError(
      new NotARepositoryError('/tmp/not-a-repo')
    );
  });

  it("classifies 'cannot change to' on stderr (removed worktree) as WorktreeNotFoundError carrying the target path", async () => {
    stubGitOutcome(
      Object.assign(new Error('Command failed'), { code: 128 }),
      '',
      "fatal: cannot change to '/tmp/gone': No such file or directory\n"
    );

    await expect(runGit('/tmp/gone', ['status'])).rejects.toThrowError(
      new WorktreeNotFoundError('/tmp/gone')
    );
  });

  it('falls back to GitCommandFailedError with error.message when stderr is empty', async () => {
    stubGitOutcome(Object.assign(new Error('Command failed: git diff'), { code: 1 }), '', '');

    await expect(runGit('/tmp/repo', ['diff'])).rejects.toThrowError(
      new GitCommandFailedError('Command failed: git diff')
    );
  });
});
