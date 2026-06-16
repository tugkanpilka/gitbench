// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ColorScheme } from '../../../../contracts/ipc';
import { stubApi } from '../../test/fixtures';
import { useColorScheme } from './useColorScheme';

/** Stubs window.api.onThemeChanged so the test can drive OS theme pushes by hand. */
function captureThemeListener(): {
  emit: (scheme: ColorScheme) => void;
  unsubscribe: ReturnType<typeof vi.fn>;
} {
  let listener: ((scheme: ColorScheme) => void) | undefined;
  const unsubscribe = vi.fn();
  stubApi({
    onThemeChanged: vi.fn((cb: (scheme: ColorScheme) => void) => {
      listener = cb;
      return unsubscribe;
    }),
  });
  return { emit: (scheme) => listener?.(scheme), unsubscribe };
}

// eslint-disable-next-line max-lines-per-function
describe('useColorScheme', () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it('applies OS theme pushes to <html data-theme>', () => {
    const { emit } = captureThemeListener();
    renderHook(() => useColorScheme());

    emit('light');
    expect(document.documentElement.dataset.theme).toBe('light');

    emit('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('subscribes once on mount and unsubscribes on unmount', () => {
    const { unsubscribe } = captureThemeListener();
    const { unmount } = renderHook(() => useColorScheme());

    expect(window.api.onThemeChanged).toHaveBeenCalledTimes(1);

    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
