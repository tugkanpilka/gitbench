import { ipcMain } from 'electron';

import {
  IPC_CHANNELS,
  type ListWorktreesRequest,
  type ListWorktreesResponse,
  type Result,
} from '../../../contracts/ipc';
import type { ApplicationServices } from '../../bootstrap/compositionRoot';
import { toWorktreeDto } from '../mappers/worktreeMapper';
import { fail, ok } from '../result';

export function registerListWorktreesHandler({
  listWorktrees,
}: Pick<ApplicationServices, 'listWorktrees'>): void {
  ipcMain.handle(
    IPC_CHANNELS.listWorktrees,
    async (
      _event,
      request: ListWorktreesRequest
    ): Promise<Result<ListWorktreesResponse>> => {
      try {
        const worktrees = await listWorktrees(request.repoPath);
        return ok(worktrees.map(toWorktreeDto));
      } catch (error) {
        return fail(error);
      }
    }
  );
}
