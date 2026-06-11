// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Badge } from '.';

afterEach(() => cleanup());

describe('Badge', () => {
  it('applies the on-selection styling hook without changing its content', () => {
    render(<Badge onSelection>8</Badge>);

    const badge = screen.getByText('8').parentElement;
    // Using CSS Modules, the class name will be different, so checking for the prop effect:
    expect(badge?.className).toContain('badge--on-selection');
  });
});
