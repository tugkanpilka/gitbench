/**
 * macOS segmented control. Active thumb gets --gb-control-active + --gb-shadow-seg.
 */
export interface SegmentedControlProps {
  items: { value: string; label: string }[];
  value: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}
