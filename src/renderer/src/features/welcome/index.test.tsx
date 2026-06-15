// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WelcomeScreen } from '.';

afterEach(() => cleanup());

// eslint-disable-next-line max-lines-per-function
describe('WelcomeScreen', () => {
  it('exposes the working repository action', () => {
    const onOpenRepository = vi.fn();
    render(<WelcomeScreen loading={false} error={null} onOpenRepository={onOpenRepository} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Repository…' }));

    expect(onOpenRepository).toHaveBeenCalledOnce();
  });

  it('keeps cloning out of the MVP welcome screen', () => {
    render(<WelcomeScreen loading={false} error={null} onOpenRepository={() => undefined} />);

    expect(screen.queryByText(/clone/i)).toBeNull();
  });

  it('disables the action while opening', () => {
    render(<WelcomeScreen loading error={null} onOpenRepository={() => undefined} />);

    expect(
      screen.getByRole('button', { name: 'Opening repository…' }).hasAttribute('disabled')
    ).toBe(true);
  });

  it('announces errors via an alert', () => {
    render(
      <WelcomeScreen
        loading={false}
        error="Not a git repository."
        onOpenRepository={() => undefined}
      />
    );

    expect(screen.getByRole('alert').textContent).toBe('Not a git repository.');
  });
});
