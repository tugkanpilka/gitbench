import type { HTMLAttributes, ReactNode } from 'react';

import './core.css';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  onSelection?: boolean;
}

export function Badge({ onSelection = false, className, children, ...props }: BadgeProps) {
  const classes = ['gb-badge', onSelection && 'gb-badge--on-selection', className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
