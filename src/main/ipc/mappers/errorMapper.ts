import { NotARepositoryError } from '../../../application/worktrees/errors/NotARepositoryError';
import { WorktreeNotFoundError } from '../../../application/worktrees/errors/WorktreeNotFoundError';
import type { ErrorDto } from '../../../contracts/ipc';
import { GitNotInstalledError } from '../../../infrastructure/git/errors/GitNotInstalledError';

export function toErrorDto(error: unknown): ErrorDto {
  if (error instanceof GitNotInstalledError) {
    return { code: 'GIT_NOT_INSTALLED', message: error.message };
  }
  if (error instanceof NotARepositoryError) {
    return { code: 'NOT_A_REPOSITORY', message: error.message };
  }
  if (error instanceof WorktreeNotFoundError) {
    return { code: 'WORKTREE_NOT_FOUND', message: error.message };
  }
  return {
    code: 'GIT_COMMAND_FAILED',
    message: error instanceof Error ? error.message : String(error),
  };
}
