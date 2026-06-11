export interface SegmentedControlItem<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface TProps<T extends string> {
  ariaLabel: string;
  items: readonly SegmentedControlItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}
