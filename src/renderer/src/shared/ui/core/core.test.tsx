// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Badge, Button, DiffStat, SegmentedControl } from '.';

afterEach(() => cleanup());

describe('core UI primitives', () => {
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

  it('styles a badge for an accent selection without changing its content', () => {
    render(<Badge onSelection>8</Badge>);

    const badge = screen.getByText('8');
    expect(badge.classList.contains('gb-badge--on-selection')).toBe(true);
  });

  it('exposes diff statistics with one accessible label', () => {
    render(<DiffStat additions={12} deletions={3} />);

    expect(screen.getByLabelText('12 additions, 3 deletions')).toBeTruthy();
    expect(screen.getByText('+12')).toBeTruthy();
    expect(screen.getByText('−3')).toBeTruthy();
  });

  it('changes a segmented value by click and arrow key', () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        ariaLabel="Diff layout"
        items={[
          { value: 'unified', label: 'Unified' },
          { value: 'split', label: 'Split' },
        ]}
        value="unified"
        onChange={onChange}
      />
    );

    const unified = screen.getByRole('radio', { name: 'Unified' });
    const split = screen.getByRole('radio', { name: 'Split' });

    expect(unified.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(split);
    expect(onChange).toHaveBeenCalledWith('split');

    fireEvent.keyDown(unified, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('split');
    expect(document.activeElement).toBe(split);
  });
});
