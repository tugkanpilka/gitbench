import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { applyTheme, readAppPreferences } from '../shared/preferences/appPreferences';
import '../styles/global.css';

// Apply the stored theme before the first paint so the window never flashes
// the default theme; useAppPreferences re-applies it (idempotently) on mount.
applyTheme(readAppPreferences().theme);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
