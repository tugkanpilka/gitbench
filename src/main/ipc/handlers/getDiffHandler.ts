import { ipcMain } from 'electron';

import {
  IPC_CHANNELS,
  type GetDiffRequest,
  type GetDiffResponse,
  type Result,
} from '../../../contracts/ipc';
import type { ApplicationServices } from '../../bootstrap/compositionRoot';
import { fail, ok } from '../result';

export function registerGetDiffHandler({
  getUncommittedDiff,
}: Pick<ApplicationServices, 'getUncommittedDiff'>): void {
  ipcMain.handle(
    IPC_CHANNELS.getDiff,
    async (_event, request: GetDiffRequest): Promise<Result<GetDiffResponse>> => {
      try {
        const diffText = await getUncommittedDiff(request.worktreePath);
        return ok({ diffText });
      } catch (error) {
        return fail(error);
      }
    }
  );
}
