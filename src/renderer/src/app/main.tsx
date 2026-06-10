import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { applyTheme, readAppPreferences } from '../shared/preferences/appPreferences';
import '../styles/global.css';

applyTheme(readAppPreferences().theme);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
