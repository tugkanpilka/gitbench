import { describe, expect, it } from 'vitest';

import { nameFromPath } from './nameFromPath';

describe('nameFromPath', () => {
  it('returns the last segment of a POSIX path', () => {
    expect(nameFromPath('/Users/dev/gitbench')).toBe('gitbench');
  });

  it('returns the last segment of a Windows path', () => {
    expect(nameFromPath('C:\\dev\\gitbench')).toBe('gitbench');
  });

  it('ignores trailing separators', () => {
    expect(nameFromPath('/Users/dev/gitbench/')).toBe('gitbench');
    expect(nameFromPath('C:\\dev\\gitbench\\')).toBe('gitbench');
  });

  it('handles mixed separators', () => {
    expect(nameFromPath('C:\\dev/gitbench')).toBe('gitbench');
  });

  it('falls back to the raw input when no segment remains', () => {
    expect(nameFromPath('/')).toBe('/');
    expect(nameFromPath('')).toBe('');
  });
});
