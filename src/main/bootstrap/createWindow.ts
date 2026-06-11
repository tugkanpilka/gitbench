import { join } from 'node:path';

import { BrowserWindow, shell } from 'electron';

export function createWindow(): void {
  const isMac = process.platform === 'darwin';
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 760,
    minHeight: 520,
    show: false,
    backgroundColor: isMac ? '#00000000' : '#1f2025',
    transparent: isMac,
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    trafficLightPosition: isMac ? { x: 16, y: 12 } : undefined,
    vibrancy: isMac ? 'sidebar' : undefined,
    visualEffectState: isMac ? 'active' : undefined,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // The electron-vite preload bundle is CommonJS and needs Node's require
      // at load time, which the Chromium sandbox forbids. The security boundary
      // remains contextIsolation + nodeIntegration:false (CLAUDE.md hard rule 1).
      sandbox: false,
    },
  });

  window.on('ready-to-show', () => window.show());

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'));
  }
}
