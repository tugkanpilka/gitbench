import type { ReactNode } from 'react';

export interface SegmentedControlItem<T extends string> {
  value: T;
  label: ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  ariaLabel: string;
  items: readonly SegmentedControlItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}
