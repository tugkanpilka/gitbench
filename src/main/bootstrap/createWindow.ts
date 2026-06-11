import { join } from 'node:path';

import { BrowserWindow, shell } from 'electron';

const WINDOW_WIDTH = 1280;
const WINDOW_HEIGHT = 800;
const WINDOW_MIN_WIDTH = 760;
const WINDOW_MIN_HEIGHT = 520;
const TRAFFIC_LIGHT_POSITION = { x: 16, y: 12 };

/**
 * Only http(s) URLs are safe to hand to the OS shell. Anything else
 * (file:, javascript:, custom protocols, malformed input) is rejected.
 */
export function isExternalUrlSafe(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

export function createWindow(): void {
  const isMac = process.platform === 'darwin';
  const window = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: WINDOW_MIN_WIDTH,
    minHeight: WINDOW_MIN_HEIGHT,
    show: false,
    backgroundColor: isMac ? '#00000000' : '#1f2025',
    transparent: isMac,
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    trafficLightPosition: isMac ? TRAFFIC_LIGHT_POSITION : undefined,
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
    if (isExternalUrlSafe(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  const rendererUrl = process.env['ELECTRON_RENDERER_URL'];
  const indexFile = join(__dirname, '../renderer/index.html');
  const appOrigin = rendererUrl ?? `file://${indexFile}`;

  window.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(appOrigin)) {
      event.preventDefault();
    }
  });

  if (rendererUrl) {
    window.loadURL(rendererUrl);
  } else {
    window.loadFile(indexFile);
  }
}
