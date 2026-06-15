import type { IpcMainInvokeEvent } from 'electron';

import { IPC_CHANNELS, type StartWatchRequest } from '../../../contracts/ipc';
import { handle, handleWithEvent } from '../handle';
import type { WatchController } from '../watchController';

// eslint-disable-next-line max-lines-per-function -- single operation: extract target + start watcher with liveness-guarded callback
async function handleStartWatch(
  controller: WatchController,
  request: StartWatchRequest,
  event: IpcMainInvokeEvent
): Promise<null> {
  const { sender } = event;
  await controller.start(
    { repoPath: request.repoPath, worktreePaths: request.worktreePaths },
    () => {
      // The window may close between a filesystem event and this callback.
      if (!sender.isDestroyed()) {
        sender.send(IPC_CHANNELS.repoChanged);
      }
    }
  );
  return null;
}

export function registerWatchHandlers(controller: WatchController): void {
  // start needs the caller's webContents so the watcher can push `repo:changed`
  // back to exactly that renderer.
  handleWithEvent<StartWatchRequest, null>(IPC_CHANNELS.startWatch, (request, event) =>
    handleStartWatch(controller, request, event)
  );

  handle<void, null>(IPC_CHANNELS.stopWatch, async () => {
    await controller.stop();
    return null;
  });
}
