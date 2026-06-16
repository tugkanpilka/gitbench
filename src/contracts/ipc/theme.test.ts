import { describe, expect, it } from 'vitest';

import { toColorScheme } from './theme';

describe('toColorScheme', () => {
  it('maps shouldUseDarkColors=true to dark', () => {
    expect(toColorScheme(true)).toBe('dark');
  });

  it('maps shouldUseDarkColors=false to light', () => {
    expect(toColorScheme(false)).toBe('light');
  });
});
