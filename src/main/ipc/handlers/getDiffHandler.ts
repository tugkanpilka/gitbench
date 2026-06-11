import { IPC_CHANNELS, type GetDiffRequest, type GetDiffResponse } from '../../../contracts/ipc';
import type { ApplicationServices } from '../../bootstrap/compositionRoot';
import { handle } from '../handle';

export function registerGetDiffHandler({
  getUncommittedDiff,
}: Pick<ApplicationServices, 'getUncommittedDiff'>): void {
  // "" is a valid clean-worktree diff and travels as a success Result.
  handle<GetDiffRequest, GetDiffResponse>(IPC_CHANNELS.getDiff, async (request) => ({
    diffText: await getUncommittedDiff(request.worktreePath),
  }));
}
