import { dialog, ipcMain } from 'electron';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { registerPickRepositoryHandler } from './pickRepositoryHandler';

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
  dialog: { showOpenDialog: vi.fn() },
}));

const ipcMainHandle = vi.mocked(ipcMain.handle);
const showOpenDialog = vi.mocked(dialog.showOpenDialog);

/** Registers the handler and returns the listener captured from the mocked ipcMain. */
function registerAndGetListener(): (event: unknown, request: unknown) => Promise<unknown> {
  registerPickRepositoryHandler();
  const call = ipcMainHandle.mock.calls.at(-1);
  if (!call) {
    throw new Error('ipcMain.handle was never called');
  }
  return call[1] as (event: unknown, request: unknown) => Promise<unknown>;
}

describe('registerPickRepositoryHandler', () => {
  beforeEach(() => {
    ipcMainHandle.mockClear();
    showOpenDialog.mockReset();
  });

  it('returns the first selected path when the dialog succeeds, registered under repo:pick', async () => {
    showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['/tmp/repo-a', '/tmp/repo-b'],
    });
    const listener = registerAndGetListener();

    expect(ipcMainHandle.mock.calls[0][0]).toBe('repo:pick');
    await expect(listener(undefined, undefined)).resolves.toEqual({
      ok: true,
      data: '/tmp/repo-a',
    });
  });

  it('yields null when the dialog is cancelled', async () => {
    showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] });
    const listener = registerAndGetListener();

    await expect(listener(undefined, undefined)).resolves.toEqual({ ok: true, data: null });
  });

  it('yields null when the dialog reports no selected paths even though it was not cancelled', async () => {
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [] });
    const listener = registerAndGetListener();

    await expect(listener(undefined, undefined)).resolves.toEqual({ ok: true, data: null });
  });
});
