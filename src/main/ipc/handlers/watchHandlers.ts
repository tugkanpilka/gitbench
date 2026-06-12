import { IPC_CHANNELS, type StartWatchRequest } from '../../../contracts/ipc';
import { handle, handleWithEvent } from '../handle';
import type { WatchController } from '../watchController';

export function registerWatchHandlers(controller: WatchController): void {
  // start needs the caller's webContents so the watcher can push `repo:changed`
  // back to exactly that renderer.
  handleWithEvent<StartWatchRequest, null>(IPC_CHANNELS.startWatch, async (request, event) => {
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
  });

  handle<void, null>(IPC_CHANNELS.stopWatch, async () => {
    await controller.stop();
    return null;
  });
}
