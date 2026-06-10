// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { APP_PREFERENCES_STORAGE_KEY } from '../shared/preferences/appPreferences';
import { installMemoryStorage } from '../test/installMemoryStorage';
import { useAppPreferences } from './useAppPreferences';

function PreferenceHarness() {
  const preferences = useAppPreferences();

  return (
    <>
      <output aria-label="Tema">{preferences.theme}</output>
      <output aria-label="Sidebar">{String(preferences.sidebarOpen)}</output>
      <output aria-label="Dosya görünümü">{preferences.fileListMode}</output>
      <button type="button" onClick={preferences.toggleTheme}>
        Temayı değiştir
      </button>
      <button type="button" onClick={preferences.toggleSidebar}>
        Sidebar&apos;ı değiştir
      </button>
      <button type="button" onClick={() => preferences.setFileListMode('flat')}>
        Düz görünüme geç
      </button>
    </>
  );
}

describe('useAppPreferences', () => {
  beforeEach(() => {
    installMemoryStorage();
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    cleanup();
    delete document.documentElement.dataset.theme;
  });

  it('restores preferences, applies the theme, and persists changes', () => {
    window.localStorage.setItem(
      APP_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ theme: 'light', sidebarOpen: false, fileListMode: 'tree' })
    );
    render(<PreferenceHarness />);

    expect(screen.getByLabelText('Tema').textContent).toBe('light');
    expect(screen.getByLabelText('Sidebar').textContent).toBe('false');
    expect(screen.getByLabelText('Dosya görünümü').textContent).toBe('tree');
    expect(document.documentElement.dataset.theme).toBe('light');

    fireEvent.click(screen.getByRole('button', { name: 'Temayı değiştir' }));
    fireEvent.click(screen.getByRole('button', { name: "Sidebar'ı değiştir" }));
    fireEvent.click(screen.getByRole('button', { name: 'Düz görünüme geç' }));

    expect(screen.getByLabelText('Tema').textContent).toBe('dark');
    expect(screen.getByLabelText('Sidebar').textContent).toBe('true');
    expect(screen.getByLabelText('Dosya görünümü').textContent).toBe('flat');
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(JSON.parse(window.localStorage.getItem(APP_PREFERENCES_STORAGE_KEY) ?? '')).toEqual({
      theme: 'dark',
      sidebarOpen: true,
      fileListMode: 'flat',
    });
  });
});
