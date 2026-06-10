export interface ErrorDto {
  code:
    | 'GIT_NOT_INSTALLED'
    | 'NOT_A_REPOSITORY'
    | 'WORKTREE_NOT_FOUND'
    | 'GIT_COMMAND_FAILED';
  message: string;
}
