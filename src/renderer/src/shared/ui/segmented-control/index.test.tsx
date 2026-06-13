// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SegmentedControl } from '.';

afterEach(() => cleanup());

describe('SegmentedControl', () => {
  function renderControl(onChange: (value: string) => void) {
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
  }

  it('changes the value by click', () => {
    const onChange = vi.fn();
    renderControl(onChange);

    expect(screen.getByRole('radio', { name: 'Unified' }).getAttribute('aria-checked')).toBe(
      'true'
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Split' }));

    expect(onChange).toHaveBeenCalledWith('split');
  });

  it('moves the selection and focus with arrow keys', () => {
    const onChange = vi.fn();
    renderControl(onChange);

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Unified' }), { key: 'ArrowRight' });

    expect(onChange).toHaveBeenLastCalledWith('split');
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Split' }));
  });

  it('applies its own compact-density class without relying on a parent override', () => {
    const { container } = render(
      <SegmentedControl
        ariaLabel="Diff layout"
        density="compact"
        items={[
          { value: 'unified', label: 'Unified' },
          { value: 'split', label: 'Split' },
        ]}
        value="unified"
        onChange={vi.fn()}
      />
    );

    const root = container.querySelector('[role="radiogroup"]');
    const compactClass = [...(root?.classList ?? [])].find((name) => name.includes('compact'));
    expect(compactClass).toBeDefined();
  });
});
