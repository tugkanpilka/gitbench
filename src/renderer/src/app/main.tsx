import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { desktopApi } from '../shared/api/desktopApi';
import { applyColorScheme } from '../shared/theme/colorScheme';
import '../styles/global.css';

// Paint the OS-resolved theme before the first frame so the window never flashes the
// wrong scheme; useColorScheme then tracks live OS switches for the rest of the session.
applyColorScheme(desktopApi.initialColorScheme);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
