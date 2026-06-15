import { Menu, shell, type MenuItemConstructorOptions } from 'electron';

import { isExternalUrlSafe } from './createWindow';

// eslint-disable-next-line max-lines-per-function -- flat menu data structure, one entry per line; cannot split meaningfully
function buildMenuTemplate(isMac: boolean): MenuItemConstructorOptions[] {
  return [
    ...(isMac ? [{ role: 'appMenu' } as MenuItemConstructorOptions] : []),
    { role: 'fileMenu' },
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

export function createMenu(): void {
  Menu.setApplicationMenu(Menu.buildFromTemplate(buildMenuTemplate(process.platform === 'darwin')));
}
