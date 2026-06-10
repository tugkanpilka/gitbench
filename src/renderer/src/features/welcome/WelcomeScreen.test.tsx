// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WelcomeScreen } from './WelcomeScreen';

afterEach(() => cleanup());

describe('WelcomeScreen', () => {
  it('exposes the working repository action', () => {
    const onOpenRepository = vi.fn();
    render(
      <WelcomeScreen loading={false} error={null} onOpenRepository={onOpenRepository} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Repository…' }));

    expect(onOpenRepository).toHaveBeenCalledOnce();
    expect(screen.queryByText(/clone/i)).toBeNull();
  });

  it('renders a loading action and an accessible error', () => {
    render(
      <WelcomeScreen
        loading
        error="Not a git repository."
        onOpenRepository={() => undefined}
      />
    );

    expect(screen.getByRole('button', { name: 'Opening repository…' }).hasAttribute('disabled')).toBe(
      true
    );
    expect(screen.getByRole('alert').textContent).toBe('Not a git repository.');
  });
});
