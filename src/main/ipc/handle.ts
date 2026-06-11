import { ipcMain } from 'electron';

import type { IPC_CHANNELS, Result } from '../../contracts/ipc';
import { fail, ok } from './result';

type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

/**
 * Registers an `ipcMain.handle` listener that wraps the handler outcome in a
 * `Result<T>` envelope. Nothing throws across IPC; failures are mapped to
 * `ErrorDto` via `fail` (see agent_docs/ipc-contract.md).
 */
export function handle<TRequest, TResponse>(
  channel: IpcChannel,
  handler: (request: TRequest) => Promise<TResponse>
): void {
  ipcMain.handle(
    channel,
    async (_event, request: TRequest): Promise<Result<TResponse>> => {
      try {
        return ok(await handler(request));
      } catch (error) {
        return fail(error);
      }
    }
  );
}
