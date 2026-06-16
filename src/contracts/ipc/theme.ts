// The resolved OS appearance the renderer paints with. There is no "system" value here:
// "system" is resolved to dark/light in the main process (the single source of truth) via
// nativeTheme.shouldUseDarkColors, so the renderer only ever sees a concrete scheme.
export type ColorScheme = 'dark' | 'light';

export function toColorScheme(shouldUseDarkColors: boolean): ColorScheme {
  return shouldUseDarkColors ? 'dark' : 'light';
}

// Main passes the initial scheme to the renderer via webPreferences.additionalArguments;
// the preload reads it back off process.argv. Shared here so both sides agree on the key.
export const COLOR_SCHEME_ARG_PREFIX = '--gb-color-scheme=';
