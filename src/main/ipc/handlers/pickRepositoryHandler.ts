import { dialog, ipcMain } from 'electron';

import {
  IPC_CHANNELS,
  type PickRepositoryResponse,
  type Result,
} from '../../../contracts/ipc';
import { fail, ok } from '../result';

export function registerPickRepositoryHandler(): void {
  // Folder picking is an Electron UI concern and deliberately bypasses application use cases.
  ipcMain.handle(
    IPC_CHANNELS.pickRepository,
    async (): Promise<Result<PickRepositoryResponse>> => {
      try {
        const { canceled, filePaths } = await dialog.showOpenDialog({
          properties: ['openDirectory'],
        });
        const selected = !canceled && filePaths.length > 0 ? filePaths[0] : null;
        return ok(selected);
      } catch (error) {
        return fail(error);
      }
    }
  );
}
