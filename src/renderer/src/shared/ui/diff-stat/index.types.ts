import type { HTMLAttributes } from 'react';

export interface DiffStats {
  additions: number;
  deletions: number;
}

export interface DiffStatProps extends HTMLAttributes<HTMLSpanElement>, DiffStats {
  onSelection?: boolean;
}
