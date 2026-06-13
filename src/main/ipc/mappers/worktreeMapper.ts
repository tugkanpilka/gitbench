import type { WorktreeDto } from '../../../contracts/ipc';
import type { ParsedWorktree } from '../../../infrastructure/git/parsers/porcelainParser';

export function toWorktreeDto(worktree: ParsedWorktree): WorktreeDto {
  return {
    path: worktree.path,
    branch: worktree.branch,
    headSha: worktree.headSha,
    isMain: worktree.isMain,
    isLocked: worktree.isLocked,
  };
}
