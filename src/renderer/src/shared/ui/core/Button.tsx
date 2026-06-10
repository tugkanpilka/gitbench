import type { ButtonHTMLAttributes, ReactNode } from 'react';

import './core.css';

export type ButtonVariant = 'primary' | 'plain' | 'secondary' | 'destructive';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

export function Button({
  variant = 'plain',
  icon,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = ['gb-button', `gb-button--${variant}`, className].filter(Boolean).join(' ');

  return (
    <button type={type} className={classes} {...props}>
      {icon !== undefined && (
        <span className="gb-button__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="gb-button__label">{children}</span>
    </button>
  );
}
