import type { TProps } from './index.types';
import styles from './index.module.scss';

export function Badge({ onSelection = false, className, children, ...props }: TProps) {
  const classes = [styles['gb-badge'], onSelection && styles['gb-badge--on-selection'], className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
