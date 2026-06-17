import { Menu, app, shell, type MenuItemConstructorOptions } from 'electron';

import { isExternalUrlSafe } from './createWindow';
import { checkForUpdatesInteractive } from './setupAutoUpdater';

function buildFileSubmenu(onNewWindow: () => void): MenuItemConstructorOptions {
  return {
    label: 'File',
    submenu: [
      { label: 'New Window', accelerator: 'CmdOrCtrl+N', click: onNewWindow },
      { type: 'separator' },
      { role: 'close' },
    ],
  };
}

// eslint-disable-next-line max-lines-per-function -- flat menu data structure, one entry per line; cannot split meaningfully
function buildMenuTemplate(isMac: boolean, onNewWindow: () => void): MenuItemConstructorOptions[] {
  return [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              {
                label: 'Check for Updates...',
                click: (): void => {
                  checkForUpdatesInteractive();
                },
              },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          } as MenuItemConstructorOptions,
        ]
      : []),
    buildFileSubmenu(onNewWindow),
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Actual Size' },
        { role: 'zoomIn', label: 'Make Font Bigger' },
        { role: 'zoomOut', label: 'Make Font Smaller' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: () => {
            const url = 'https://electronjs.org';
            if (isExternalUrlSafe(url)) {
              shell.openExternal(url);
            }
          },
        },
      ],
    },
  ];
}

export function createMenu(onNewWindow: () => void): void {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate(buildMenuTemplate(process.platform === 'darwin', onNewWindow))
  );
}
