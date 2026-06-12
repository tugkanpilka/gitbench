import type { UnpushedCommits } from '../../../application/worktrees/ports/CommitReader';
import type { ListUnpushedCommitsResponse } from '../../../contracts/ipc';

export function toListUnpushedCommitsResponse(
  result: UnpushedCommits
): ListUnpushedCommitsResponse {
  // The application shape is structurally identical to the DTO; the explicit return
  // type is the seam — a divergence between the two becomes a compile error here.
  return {
    truncated: result.truncated,
    commits: result.commits,
  };
}
