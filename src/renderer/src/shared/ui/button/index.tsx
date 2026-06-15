import type { ReactNode } from 'react';
import { cx } from '../cx';
import { Visibility } from '../visibility';
import type { ButtonProps } from './index.types';
import styles from './index.module.scss';

function ButtonIcon({ icon }: { icon: ReactNode }) {
  return (
    <span className={styles['gb-button__icon']} aria-hidden="true">
      {icon}
    </span>
  );
}

function ButtonBody({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <>
      <Visibility isVisible={icon !== undefined}>
        <ButtonIcon icon={icon} />
      </Visibility>
      <span className={styles['gb-button__label']}>{children}</span>
    </>
  );
}

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
      <ButtonBody icon={icon}>{children}</ButtonBody>
    </button>
  );
}
