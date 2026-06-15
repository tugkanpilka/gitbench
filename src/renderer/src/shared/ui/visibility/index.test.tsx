// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Visibility } from '.';

afterEach(() => cleanup());

describe('Visibility', () => {
  it('renders children when visible', () => {
    render(<Visibility isVisible>shown</Visibility>);

    expect(screen.getByText('shown')).toBeTruthy();
  });

  it('renders nothing when hidden', () => {
    const { container } = render(<Visibility isVisible={false}>hidden</Visibility>);

    expect(container.textContent).toBe('');
  });
});
