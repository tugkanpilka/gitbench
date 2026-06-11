// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Button } from '.';

afterEach(() => cleanup());

describe('Button', () => {
  it('renders a native button and defaults to type button', () => {
    const onClick = vi.fn();
    render(
      <Button variant="primary" icon="+" onClick={onClick}>
        Open repository
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Open repository' });
    expect(button.getAttribute('type')).toBe('button');

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
