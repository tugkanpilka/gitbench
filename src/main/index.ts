import { BrowserWindow, app } from 'electron';

import { createApplicationServices } from './bootstrap/compositionRoot';
import { createMenu } from './bootstrap/createMenu';
import { createWindow } from './bootstrap/createWindow';
import { setupAutoUpdater } from './bootstrap/setupAutoUpdater';
import { registerHandlers } from './ipc/registerHandlers';

app.setName('GitBench');

app.whenReady().then(() => {
  registerHandlers(createApplicationServices());
  createMenu();
  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
