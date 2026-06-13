import { runGit } from './runGit';

// How "unpushed" is defined for a worktree, in priority order:
//  - 'upstream': the branch tracks an upstream → compare against @{upstream}.
//  - 'remotes':  no upstream, but the repo has remotes → commits absent from every
//                remote-tracking ref.
//  - 'none':     no upstream and no remote → "unpushed" is undefined.
//
// Shared by the commit reader (which maps the strategy to a `git log` range) and the
// summary reader (which maps it to ahead/behind counts) so the precedence lives once.
export type UnpushedStrategy = 'upstream' | 'remotes' | 'none';

export async function resolveUnpushedStrategy(
  worktreePath: string,
  hasUpstream: boolean
): Promise<UnpushedStrategy> {
  if (hasUpstream) {
    return 'upstream';
  }
  const remotes = (await runGit(worktreePath, ['remote'])).trim();
  return remotes.length === 0 ? 'none' : 'remotes';
}
