import { dialog } from 'electron';

import { IPC_CHANNELS, type PickRepositoryResponse } from '../../../contracts/ipc';
import { handle } from '../handle';

export function registerPickRepositoryHandler(): void {
  // Folder picking is an Electron UI concern and deliberately bypasses application use cases.
  handle<void, PickRepositoryResponse>(IPC_CHANNELS.pickRepository, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return !canceled && filePaths.length > 0 ? filePaths[0] : null;
  });
}
