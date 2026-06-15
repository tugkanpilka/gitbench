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

interface StubGitOutcomeOptions {
  error: Error | null;
  stdout?: string;
  stderr?: string;
}

/** Makes the mocked execFile invoke its callback with the given outcome. */
function stubGitOutcome({ error, stdout = '', stderr = '' }: StubGitOutcomeOptions): void {
  function impl(...execArgs: unknown[]): void {
    const callback = execArgs[3] as ExecFileCallback;
    callback(error, stdout, stderr);
  }
  execFileMock.mockImplementation(impl);
}

// eslint-disable-next-line max-lines-per-function
describe('runGit', () => {
  beforeEach(() => {
    execFileMock.mockReset();
  });

  it('spawns git with an argument array [-C, targetPath, ...args] and a prompt-free, lock-free, LC_ALL=C environment', async () => {
    stubGitOutcome({ error: null, stdout: 'stdout payload' });

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
    stubGitOutcome({ error: Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' }) });

    await expect(runGit('/tmp/repo', ['status'])).rejects.toBeInstanceOf(GitNotInstalledError);
  });

  it("classifies 'not a git repository' on stderr as NotARepositoryError carrying the target path", async () => {
    stubGitOutcome({
      error: Object.assign(new Error('Command failed'), { code: 128 }),
      stderr: 'fatal: not a git repository (or any of the parent directories): .git\n',
    });

    await expect(runGit('/tmp/not-a-repo', ['status'])).rejects.toThrowError(
      new NotARepositoryError('/tmp/not-a-repo')
    );
  });

  it("classifies 'cannot change to' on stderr (removed worktree) as WorktreeNotFoundError carrying the target path", async () => {
    stubGitOutcome({
      error: Object.assign(new Error('Command failed'), { code: 128 }),
      stderr: "fatal: cannot change to '/tmp/gone': No such file or directory\n",
    });

    await expect(runGit('/tmp/gone', ['status'])).rejects.toThrowError(
      new WorktreeNotFoundError('/tmp/gone')
    );
  });

  it('falls back to GitCommandFailedError with error.message when stderr is empty', async () => {
    stubGitOutcome({ error: Object.assign(new Error('Command failed: git diff'), { code: 1 }) });

    await expect(runGit('/tmp/repo', ['diff'])).rejects.toThrowError(
      new GitCommandFailedError('Command failed: git diff')
    );
  });

  it('accepts an explicitly allowed data-bearing exit code when stderr is empty', async () => {
    const diff = 'diff --git a/new.txt b/new.txt\n';
    stubGitOutcome({ error: Object.assign(new Error('files differ'), { code: 1 }), stdout: diff });

    await expect(
      runGit('/tmp/repo', ['diff', '--no-index', '/dev/null', 'new.txt'], {
        acceptedExitCodes: [1],
      })
    ).resolves.toBe(diff);
  });

  it('does not accept an allowed exit code when git also reports an error', async () => {
    stubGitOutcome({
      error: Object.assign(new Error('files differ'), { code: 1 }),
      stderr: "error: Could not access 'missing.txt'\n",
    });

    await expect(
      runGit('/tmp/repo', ['diff', '--no-index', '/dev/null', 'missing.txt'], {
        acceptedExitCodes: [1],
      })
    ).rejects.toThrow("Could not access 'missing.txt'");
  });
});
