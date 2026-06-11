/**
 * Single source of truth for IPC error codes. The string values are part of the
 * IPC contract (agent_docs/ipc-contract.md) — keep them byte-stable.
 */
export const ERROR_CODES = {
  GIT_NOT_INSTALLED: 'GIT_NOT_INSTALLED',
  NOT_A_REPOSITORY: 'NOT_A_REPOSITORY',
  WORKTREE_NOT_FOUND: 'WORKTREE_NOT_FOUND',
  GIT_COMMAND_FAILED: 'GIT_COMMAND_FAILED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ErrorDto {
  code: ErrorCode;
  message: string;
}
