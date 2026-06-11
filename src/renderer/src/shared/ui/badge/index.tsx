import { cx } from '../cx';
import type { BadgeProps } from './index.types';
import styles from './index.module.scss';

export function Badge({ onSelection = false, className, children, ...props }: BadgeProps) {
  const classes = cx(
    styles['gb-badge'],
    onSelection && styles['gb-badge--on-selection'],
    className
  );

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
