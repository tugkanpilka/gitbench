import { NotARepositoryError } from '../../../application/worktrees/errors/NotARepositoryError';
import { WorktreeNotFoundError } from '../../../application/worktrees/errors/WorktreeNotFoundError';
import { ERROR_CODES, type ErrorDto } from '../../../contracts/ipc';
import { GitCommandFailedError } from '../../../infrastructure/git/errors/GitCommandFailedError';
import { GitNotInstalledError } from '../../../infrastructure/git/errors/GitNotInstalledError';

// eslint-disable-next-line max-lines-per-function -- closed mapping table, cannot split meaningfully
export function toErrorDto(error: unknown): ErrorDto {
  if (error instanceof GitNotInstalledError) {
    return { code: ERROR_CODES.GIT_NOT_INSTALLED, message: error.message };
  }
  if (error instanceof NotARepositoryError) {
    return { code: ERROR_CODES.NOT_A_REPOSITORY, message: error.message };
  }
  if (error instanceof WorktreeNotFoundError) {
    return { code: ERROR_CODES.WORKTREE_NOT_FOUND, message: error.message };
  }
  if (error instanceof GitCommandFailedError) {
    return { code: ERROR_CODES.GIT_COMMAND_FAILED, message: error.message };
  }
  // Anything unexpected still travels as GIT_COMMAND_FAILED (ipc-contract.md).
  return {
    code: ERROR_CODES.GIT_COMMAND_FAILED,
    message: error instanceof Error ? error.message : String(error),
  };
}
