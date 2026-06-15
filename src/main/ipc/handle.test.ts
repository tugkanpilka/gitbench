import { ipcMain } from 'electron';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IPC_CHANNELS } from '../../contracts/ipc';
import { handle } from './handle';

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
}));

const ipcMainHandle = vi.mocked(ipcMain.handle);

/** Returns the listener that `handle` registered on the mocked `ipcMain.handle`. */
function registeredListener(): (event: unknown, request: unknown) => Promise<unknown> {
  const call = ipcMainHandle.mock.calls.at(-1);
  if (!call) {
    throw new Error('ipcMain.handle was never called');
  }
  return call[1] as (event: unknown, request: unknown) => Promise<unknown>;
}

// eslint-disable-next-line max-lines-per-function
describe('handle', () => {
  beforeEach(() => {
    ipcMainHandle.mockClear();
  });

  it("registers the listener under the exact IPC_CHANNELS constant and wraps a resolving handler's value in {ok:true, data}", async () => {
    handle<void, string>(IPC_CHANNELS.getDiff, async () => 'diff --git a/x b/x');

    expect(ipcMainHandle).toHaveBeenCalledTimes(1);
    expect(ipcMainHandle.mock.calls[0][0]).toBe('diff:get');

    await expect(registeredListener()(undefined, undefined)).resolves.toEqual({
      ok: true,
      data: 'diff --git a/x b/x',
    });
  });

  it('passes the request payload through to the handler unchanged', async () => {
    const handler = vi.fn(async (request: { repoPath: string }) => request.repoPath);
    handle(IPC_CHANNELS.listWorktrees, handler);

    await registeredListener()(undefined, { repoPath: '/tmp/repo' });

    expect(handler).toHaveBeenCalledExactlyOnceWith({ repoPath: '/tmp/repo' });
  });

  it('never rejects across IPC: a throwing handler resolves to {ok:false, error: ErrorDto}', async () => {
    handle<void, never>(IPC_CHANNELS.getDiff, async () => {
      throw new Error('git diff exited with 128');
    });

    await expect(registeredListener()(undefined, undefined)).resolves.toEqual({
      ok: false,
      error: { code: 'GIT_COMMAND_FAILED', message: 'git diff exited with 128' },
    });
  });

  it('maps non-Error throwables into the {ok:false, error: ErrorDto} envelope as well', async () => {
    handle<void, never>(IPC_CHANNELS.getDiff, async () => {
      throw 'plain string failure'; // deliberately a non-Error throwable
    });

    await expect(registeredListener()(undefined, undefined)).resolves.toEqual({
      ok: false,
      error: { code: 'GIT_COMMAND_FAILED', message: 'plain string failure' },
    });
  });
});
