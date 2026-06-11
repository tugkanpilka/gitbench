import type { HTMLAttributes, ReactNode } from 'react';

export interface TProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  onSelection?: boolean;
}
