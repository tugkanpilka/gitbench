import { describe, expect, it } from 'vitest';

import { toggledSet } from './toggledSet';

describe('toggledSet', () => {
  it('adds a value that is absent', () => {
    expect(toggledSet(new Set(['a']), 'b')).toEqual(new Set(['a', 'b']));
  });

  it('removes a value that is present', () => {
    expect(toggledSet(new Set(['a', 'b']), 'b')).toEqual(new Set(['a']));
  });

  it('does not mutate the input set', () => {
    const input = new Set(['a']);
    toggledSet(input, 'a');
    expect(input).toEqual(new Set(['a']));
  });
});
