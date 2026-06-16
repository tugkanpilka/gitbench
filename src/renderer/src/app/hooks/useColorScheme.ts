import { useEffect } from 'react';

import { desktopApi } from '../../shared/api/desktopApi';
import { applyColorScheme } from '../../shared/theme/colorScheme';

/**
 * Keeps <html data-theme> in sync with the OS appearance for the window's lifetime.
 * The initial scheme is applied pre-paint in main.tsx; this only handles live OS switches.
 * The listener never changes, so a single mount-time subscription suffices.
 */
export function useColorScheme(): void {
  useEffect(() => desktopApi.onThemeChanged(applyColorScheme), []);
}
