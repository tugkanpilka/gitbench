import type { HTMLAttributes } from 'react';

export interface DiffStats {
  additions: number;
  deletions: number;
}

export interface TProps extends HTMLAttributes<HTMLSpanElement>, DiffStats {
  onSelection?: boolean;
}
