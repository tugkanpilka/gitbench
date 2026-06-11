import { BrowserWindow, app } from 'electron';

import { createApplicationServices } from './bootstrap/compositionRoot';
import { createMenu } from './bootstrap/createMenu';
import { createWindow } from './bootstrap/createWindow';
import { setupAutoUpdater } from './bootstrap/setupAutoUpdater';
import { registerHandlers } from './ipc/registerHandlers';
import { createWatchController } from './ipc/watchController';

app.setName('GitBench');

const services = createApplicationServices();
const watchController = createWatchController(services);

// A filesystem watch must never outlive the window that asked for it: dispose it when
// the window closes (renderer unmount cannot be relied on once webContents is gone).
function spawnWindow(): void {
  const window = createWindow();
  window.on('closed', () => {
    void watchController.stop();
  });
}

app.whenReady().then(() => {
  registerHandlers(services, watchController);
  createMenu();
  spawnWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) spawnWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  void watchController.stop();
});
