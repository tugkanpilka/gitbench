import type { HTMLAttributes } from 'react';

import './core.css';

export interface DiffStatProps extends HTMLAttributes<HTMLSpanElement> {
  additions: number;
  deletions: number;
  onSelection?: boolean;
}

export function DiffStat({
  additions,
  deletions,
  onSelection = false,
  className,
  ...props
}: DiffStatProps) {
  const classes = ['gb-diff-stat', onSelection && 'gb-diff-stat--on-selection', className]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      aria-label={`${additions} ${additions === 1 ? 'addition' : 'additions'}, ${deletions} ${deletions === 1 ? 'deletion' : 'deletions'}`}
      {...props}
    >
      <span className="gb-diff-stat__add" aria-hidden="true">
        +{additions}
      </span>
      <span className="gb-diff-stat__delete" aria-hidden="true">
        −{deletions}
      </span>
    </span>
  );
}
