import { cx } from '../cx';
import type { ButtonProps } from './index.types';
import styles from './index.module.scss';

export function Button({
  variant = 'plain',
  icon,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = cx(styles['gb-button'], styles[`gb-button--${variant}`], className);

  return (
    <button type={type} className={classes} {...props}>
      {icon !== undefined && (
        <span className={styles['gb-button__icon']} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className={styles['gb-button__label']}>{children}</span>
    </button>
  );
}
