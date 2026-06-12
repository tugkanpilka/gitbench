import { runGit } from './runGit';

/**
 * True if `ref` resolves to an object in the worktree's repository.
 *
 * `--verify --quiet` makes git exit 1 with empty stderr (and empty stdout) when the
 * ref simply doesn't exist — unborn HEAD, no upstream configured, detached HEAD for
 * `@{upstream}` — which `acceptedExitCodes` accepts. A real failure (corrupt ref,
 * bad object) still writes to stderr and rejects with a classified error, so callers
 * never mistake breakage for "ref absent".
 */
export async function refResolves(worktreePath: string, ref: string): Promise<boolean> {
  const stdout = await runGit(worktreePath, ['rev-parse', '--verify', '--quiet', ref], {
    acceptedExitCodes: [1],
  });
  return stdout.trim().length > 0;
}
