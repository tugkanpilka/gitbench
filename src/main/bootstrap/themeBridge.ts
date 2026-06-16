import { BrowserWindow, nativeTheme } from 'electron';

import { IPC_CHANNELS, toColorScheme, type ColorScheme } from '../../contracts/ipc';

/**
 * The OS appearance as resolved by Chromium's native theme — the single source of truth.
 * The renderer never re-derives light/dark itself (its `prefers-color-scheme` does not
 * reliably track the OS in Electron); it only ever applies the scheme main hands it.
 */
export function currentColorScheme(): ColorScheme {
  return toColorScheme(nativeTheme.shouldUseDarkColors);
}

/** Push the resolved scheme to every open window whenever the OS appearance changes. */
export function broadcastThemeChanges(): void {
  // Process-lifetime listener on the nativeTheme singleton — intentionally never removed.
  nativeTheme.on('updated', () => {
    const scheme = currentColorScheme();
    for (const window of BrowserWindow.getAllWindows()) {
      // A window may be torn down between the OS event and this callback.
      if (!window.webContents.isDestroyed()) {
        window.webContents.send(IPC_CHANNELS.themeChanged, scheme);
      }
    }
  });
}
