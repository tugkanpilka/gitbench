import type { ColorScheme } from '../../../../contracts/ipc';

// The main process owns light/dark; the renderer just reflects the resolved scheme onto
// <html data-theme>, which colors.css keys its palette off. Never derive the scheme here.
export function applyColorScheme(scheme: ColorScheme): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.dataset.theme = scheme;
}
