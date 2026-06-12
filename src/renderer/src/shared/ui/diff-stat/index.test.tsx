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
});
