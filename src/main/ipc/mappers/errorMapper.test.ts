import { describe, expect, it } from 'vitest';

import { NotARepositoryError } from '../../../application/worktrees/errors/NotARepositoryError';
import { WorktreeNotFoundError } from '../../../application/worktrees/errors/WorktreeNotFoundError';
import { GitCommandFailedError } from '../../../infrastructure/git/errors/GitCommandFailedError';
import { GitNotInstalledError } from '../../../infrastructure/git/errors/GitNotInstalledError';
import { toErrorDto } from './errorMapper';

describe('toErrorDto', () => {
  it('maps GitNotInstalledError to GIT_NOT_INSTALLED', () => {
    expect(toErrorDto(new GitNotInstalledError())).toEqual({
      code: 'GIT_NOT_INSTALLED',
      message: 'Git is not installed or not on PATH.',
    });
  });

  it('maps NotARepositoryError to NOT_A_REPOSITORY', () => {
    expect(toErrorDto(new NotARepositoryError('/tmp/not-a-repo'))).toEqual({
      code: 'NOT_A_REPOSITORY',
      message: 'Not a git repository: /tmp/not-a-repo',
    });
  });

  it('maps WorktreeNotFoundError to WORKTREE_NOT_FOUND', () => {
    expect(toErrorDto(new WorktreeNotFoundError('/tmp/missing'))).toEqual({
      code: 'WORKTREE_NOT_FOUND',
      message: 'Worktree not found: /tmp/missing',
    });
  });

  it('maps GitCommandFailedError to GIT_COMMAND_FAILED', () => {
    expect(toErrorDto(new GitCommandFailedError('git diff exited with 128'))).toEqual({
      code: 'GIT_COMMAND_FAILED',
      message: 'git diff exited with 128',
    });
  });

  it('maps any other Error to GIT_COMMAND_FAILED with its message', () => {
    expect(toErrorDto(new Error('something unexpected'))).toEqual({
      code: 'GIT_COMMAND_FAILED',
      message: 'something unexpected',
    });
  });

  it('stringifies non-Error throwables into GIT_COMMAND_FAILED', () => {
    expect(toErrorDto('plain string failure')).toEqual({
      code: 'GIT_COMMAND_FAILED',
      message: 'plain string failure',
    });
  });
});
