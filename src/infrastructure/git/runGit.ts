import { execFile, type ExecFileException } from 'node:child_process';

import { NotARepositoryError } from '../../application/worktrees/errors/NotARepositoryError';
import { WorktreeNotFoundError } from '../../application/worktrees/errors/WorktreeNotFoundError';
import { GitCommandFailedError } from './errors/GitCommandFailedError';
import { GitNotInstalledError } from './errors/GitNotInstalledError';

// Node's default maxBuffer is 1 MiB; a large diff exceeds it and kills the process.
// If real-world diffs ever exceed this, switch to streaming spawn — do not keep raising it.
const MAX_BUFFER_BYTES = 64 * 1024 * 1024;

// stderr substrings sniffed for error classification. Stable because LC_ALL='C'
// forces untranslated English output (see agent_docs/git-notes.md).
const GIT_NOT_REPO_PATTERN = 'not a git repository';
const GIT_CANNOT_CHANGE_DIR_PATTERN = 'cannot change to';

const GIT_ENV: NodeJS.ProcessEnv = {
  ...process.env,
  GIT_TERMINAL_PROMPT: '0', // never hang on a credential prompt
  GIT_OPTIONAL_LOCKS: '0', // read-only commands must not take optional locks
  LC_ALL: 'C', // stable English output — stderr is sniffed for classification below
};

interface RunGitOptions {
  /**
   * Git uses non-zero exit codes for some successful, data-bearing commands.
   * The exit is accepted only when stderr is empty, so real command failures
   * are still classified and surfaced.
   */
  acceptedExitCodes?: readonly number[];
}

/**
 * The single choke point for spawning git. All quirks and rules: agent_docs/git-notes.md.
 * Argument arrays only — never interpolate a path into a shell string.
 */
export function runGit(
  targetPath: string,
  args: readonly string[],
  options: RunGitOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      'git',
      ['-C', targetPath, ...args],
      { encoding: 'utf8', maxBuffer: MAX_BUFFER_BYTES, env: GIT_ENV },
      makeExecCallback({ resolve, reject, targetPath, options })
    );
  });
}

interface ExecCallbackContext {
  resolve: (value: string) => void;
  reject: (reason: Error) => void;
  targetPath: string;
  options: RunGitOptions;
}

function makeExecCallback({
  resolve,
  reject,
  targetPath,
  options,
}: ExecCallbackContext): (error: ExecFileException | null, stdout: string, stderr: string) => void {
  return (error, stdout, stderr) => {
    if (!error || isAcceptedExit(error, stderr, options.acceptedExitCodes)) {
      resolve(stdout);
      return;
    }
    reject(classify(error, stderr, targetPath));
  };
}

function isAcceptedExit(
  error: ExecFileException,
  stderr: string,
  acceptedExitCodes: readonly number[] | undefined
): boolean {
  return (
    typeof error.code === 'number' &&
    acceptedExitCodes?.includes(error.code) === true &&
    stderr.length === 0
  );
}

function classify(error: ExecFileException, stderr: string, targetPath: string): Error {
  if (error.code === 'ENOENT') {
    return new GitNotInstalledError();
  }
  if (stderr.includes(GIT_NOT_REPO_PATTERN)) {
    return new NotARepositoryError(targetPath);
  }
  // `git -C <path>` against a removed directory: "fatal: cannot change to '<path>': ..."
  // — the stale/removed-worktree case.
  if (stderr.includes(GIT_CANNOT_CHANGE_DIR_PATTERN)) {
    return new WorktreeNotFoundError(targetPath);
  }
  return new GitCommandFailedError(stderr.trim() || error.message);
}
