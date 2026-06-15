// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Match, Switch } from '.';

afterEach(() => cleanup());

describe('Switch', () => {
  it('renders only the first matching branch (first-match-wins)', () => {
    render(
      <Switch>
        <Match when={false}>first</Match>
        <Match when={true}>second</Match>
        <Match when={true}>third</Match>
      </Switch>
    );

    expect(screen.queryByText('first')).toBeNull();
    expect(screen.getByText('second')).toBeTruthy();
    expect(screen.queryByText('third')).toBeNull();
  });

  it('renders nothing when no branch matches', () => {
    const { container } = render(
      <Switch>
        <Match when={false}>only</Match>
      </Switch>
    );

    expect(container.textContent).toBe('');
  });
});
