import type { HTMLAttributes } from 'react';

export interface DiffStats {
  additions: number;
  deletions: number;
}

export type DiffStatEmphasis = 'default' | 'muted';

export interface DiffStatProps extends HTMLAttributes<HTMLSpanElement>, DiffStats {
  onSelection?: boolean;
  /** Visual prominence. 'muted' dims and slightly shrinks the stat. */
  emphasis?: DiffStatEmphasis;
}
