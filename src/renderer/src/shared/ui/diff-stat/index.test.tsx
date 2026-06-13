// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DiffStat } from '.';

afterEach(() => cleanup());

describe('DiffStat', () => {
  it('exposes diff statistics with one accessible label', () => {
    render(<DiffStat additions={12} deletions={3} />);

    expect(screen.getByLabelText('12 additions, 3 deletions')).toBeTruthy();
    expect(screen.getByText('+12')).toBeTruthy();
    expect(screen.getByText('−3')).toBeTruthy();
  });

  it('omits zero values when the other side has changes', () => {
    const { rerender } = render(<DiffStat additions={12} deletions={0} />);

    expect(screen.getByLabelText('12 additions, 0 deletions').textContent).toBe('+12');

    rerender(<DiffStat additions={0} deletions={3} />);

    expect(screen.getByLabelText('0 additions, 3 deletions').textContent).toBe('−3');
  });

  it('applies its own muted-emphasis class without relying on a parent override', () => {
    const { rerender } = render(<DiffStat additions={1} deletions={1} />);
    const defaultClass = screen.getByLabelText('1 addition, 1 deletion').className;
    expect(defaultClass).not.toMatch(/muted/);

    rerender(<DiffStat additions={1} deletions={1} emphasis="muted" />);
    expect(screen.getByLabelText('1 addition, 1 deletion').className).toMatch(/muted/);
  });
});
