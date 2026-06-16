// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { applyColorScheme } from './colorScheme';

// eslint-disable-next-line max-lines-per-function
describe('applyColorScheme', () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it("sets data-theme='light' for the light scheme", () => {
    applyColorScheme('light');

    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it("sets data-theme='dark' for the dark scheme", () => {
    applyColorScheme('dark');

    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('overwrites a previously applied scheme', () => {
    applyColorScheme('light');
    applyColorScheme('dark');

    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
