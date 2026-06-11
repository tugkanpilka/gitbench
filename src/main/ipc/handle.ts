import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { IPC_CHANNELS, Result } from '../../contracts/ipc';
import { fail, ok } from './result';

type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

/**
 * Like `handle`, but the handler also receives the raw `IpcMainInvokeEvent`. Use
 * this only when a handler needs the caller's `webContents` — e.g. to push an event
 * back to that renderer (`watch:start` → `repo:changed`). Same `Result<T>` envelope.
 */
export function handleWithEvent<TRequest, TResponse>(
  channel: IpcChannel,
  handler: (request: TRequest, event: IpcMainInvokeEvent) => Promise<TResponse>
): void {
  ipcMain.handle(channel, async (event, request: TRequest): Promise<Result<TResponse>> => {
    try {
      return ok(await handler(request, event));
    } catch (error) {
      return fail(error);
    }
  });
}

/**
 * Registers an `ipcMain.handle` listener that wraps the handler outcome in a
 * `Result<T>` envelope. Nothing throws across IPC; failures are mapped to
 * `ErrorDto` via `fail` (see agent_docs/ipc-contract.md).
 */
export function handle<TRequest, TResponse>(
  channel: IpcChannel,
  handler: (request: TRequest) => Promise<TResponse>
): void {
  handleWithEvent<TRequest, TResponse>(channel, (request) => handler(request));
}
