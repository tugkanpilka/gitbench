import { join } from 'node:path';

import { BrowserWindow, shell, type BrowserWindowConstructorOptions } from 'electron';

import { COLOR_SCHEME_ARG_PREFIX, type ColorScheme } from '../../contracts/ipc';
import { currentColorScheme } from './themeBridge';

const WINDOW_WIDTH = 1280;
const WINDOW_HEIGHT = 800;
const WINDOW_MIN_WIDTH = 760;
const WINDOW_MIN_HEIGHT = 520;
const TRAFFIC_LIGHT_POSITION = { x: 16, y: 16 };

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

// On Mac the window is transparent for vibrancy; elsewhere it paints a solid base that
// must match the resolved scheme so the frame never flashes the wrong color before paint.
function resolveBackgroundColor(isMac: boolean, scheme: ColorScheme): string {
  if (isMac) return '#00000000';
  return scheme === 'light' ? '#ffffff' : '#1f2025';
}

// eslint-disable-next-line max-lines-per-function -- flat BrowserWindow options object, one property per line; cannot split meaningfully
function buildWindowOptions(isMac: boolean, scheme: ColorScheme): BrowserWindowConstructorOptions {
  return {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: WINDOW_MIN_WIDTH,
    minHeight: WINDOW_MIN_HEIGHT,
    show: false,
    backgroundColor: resolveBackgroundColor(isMac, scheme),
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    // exactOptionalPropertyTypes: omit the mac-only keys entirely off-mac
    // rather than passing `undefined`.
    ...(isMac
      ? {
          trafficLightPosition: TRAFFIC_LIGHT_POSITION,
          vibrancy: 'sidebar' as const,
        }
      : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // The electron-vite preload bundle is CommonJS and needs Node's require
      // at load time, which the Chromium sandbox forbids. The security boundary
      // remains contextIsolation + nodeIntegration:false (CLAUDE.md hard rule 1).
      sandbox: false,
      // Hand the renderer the resolved scheme synchronously so it can paint the right
      // theme before the first frame (preload reads it back off process.argv).
      additionalArguments: [`${COLOR_SCHEME_ARG_PREFIX}${scheme}`],
    },
  };
}

// eslint-disable-next-line max-lines-per-function -- sequential lifecycle steps (show, open-handler, navigate-guard, load) that belong together
function wireWindowLifecycle(window: BrowserWindow, rendererUrl: string | undefined): void {
  window.on('ready-to-show', () => window.show());

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalUrlSafe(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

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

export function createWindow(): BrowserWindow {
  const isMac = process.platform === 'darwin';
  const win = new BrowserWindow(buildWindowOptions(isMac, currentColorScheme()));
  wireWindowLifecycle(win, process.env['ELECTRON_RENDERER_URL']);
  return win;
}
