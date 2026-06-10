import type { WorktreeDto } from '../../../contracts/ipc';
import type { Worktree } from '../../../domain/worktree/Worktree';

export function toWorktreeDto(worktree: Worktree): WorktreeDto {
  return {
    path: worktree.path,
    branch: worktree.branch,
    headSha: worktree.headSha,
    isMain: worktree.isMain,
    isLocked: worktree.isLocked,
  };
}
