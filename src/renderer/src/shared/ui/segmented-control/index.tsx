import { type KeyboardEvent, type RefObject, useLayoutEffect, useRef, useState } from 'react';
import { cx } from '../cx';
import { Visibility } from '../visibility';
import type { SegmentedControlProps, SegmentedControlItem } from './index.types';
import styles from './index.module.scss';

function nextEnabledIndex<T extends string>(
  items: readonly SegmentedControlItem<T>[],
  currentIndex: number,
  direction: 1 | -1
): number {
  for (let offset = 1; offset <= items.length; offset += 1) {
    const candidate = (currentIndex + direction * offset + items.length) % items.length;
    if (!items[candidate].disabled) return candidate;
  }
  return currentIndex;
}

function getRadioButtons(ref: RefObject<HTMLDivElement | null>): NodeListOf<HTMLButtonElement> | undefined {
  return ref.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
}

function resolveIndicatorStyle<T extends string>(
  containerRef: RefObject<HTMLDivElement | null>,
  items: readonly SegmentedControlItem<T>[],
  value: T
): { left: number; width: number } | null {
  const selectedIndex = items.findIndex((item) => item.value === value);
  if (selectedIndex === -1) return null;
  const btn = getRadioButtons(containerRef)?.[selectedIndex];
  if (btn === undefined) return null;
  return { left: btn.offsetLeft, width: btn.offsetWidth };
}

function resolveKeyDirection(key: string): 1 | -1 | null {
  if (key === 'ArrowRight' || key === 'ArrowDown') return 1;
  if (key === 'ArrowLeft' || key === 'ArrowUp') return -1;
  return null;
}

function itemAriaLabel<T extends string>(item: SegmentedControlItem<T>): string | undefined {
  return item.ariaLabel ?? (typeof item.label === 'string' ? item.label : undefined);
}

interface SegmentItemProps<T extends string> {
  item: SegmentedControlItem<T>;
  selected: boolean;
  index: number;
  onChange: (value: T) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, index: number) => void;
}

function SegmentItemButton<T extends string>(props: SegmentItemProps<T>) {
  const { item, selected, index, onChange, onKeyDown } = props;
  return (
    <button
      type="button" role="radio"
      className={styles['gb-segmented-control__item']}
      aria-label={itemAriaLabel(item)} aria-checked={selected}
      disabled={item.disabled} tabIndex={selected ? 0 : -1}
      onClick={() => onChange(item.value)}
      onKeyDown={(e) => onKeyDown(e, index)}
    >{item.label}</button>
  );
}

function SegmentIndicator({ style }: { style: { left: number; width: number } | null }) {
  return (
    <Visibility isVisible={style !== null}>
      <span className={styles['gb-segmented-control__indicator']} aria-hidden="true" style={style ?? undefined} />
    </Visibility>
  );
}

interface SegmentItemsProps<T extends string> {
  items: readonly SegmentedControlItem<T>[];
  value: T;
  onChange: (v: T) => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>, i: number) => void;
}

function SegmentItems<T extends string>({ items, value, onChange, onKeyDown }: SegmentItemsProps<T>) {
  return items.map((item, index) => (
    <SegmentItemButton
      key={item.value}
      item={item}
      selected={item.value === value}
      index={index}
      onChange={onChange}
      onKeyDown={onKeyDown}
    />
  ));
}

interface StateOptions<T extends string> {
  containerRef: RefObject<HTMLDivElement | null>;
  items: readonly SegmentedControlItem<T>[];
  value: T;
  onChange: (v: T) => void;
}

function useSegmentedControlState<T extends string>({ containerRef, items, value, onChange }: StateOptions<T>) {
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    setIndicatorStyle(resolveIndicatorStyle(containerRef, items, value));
  }, [items, value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const direction = resolveKeyDirection(event.key);
    if (direction === null || items.length === 0) return;
    event.preventDefault();
    const nextIndex = nextEnabledIndex(items, index, direction);
    onChange(items[nextIndex].value);
    getRadioButtons(containerRef)?.[nextIndex]?.focus();
  };

  return { indicatorStyle, handleKeyDown };
}

function segmentedControlClasses(density: string, className?: string) {
  return cx(
    styles['gb-segmented-control'],
    density === 'compact' && styles['gb-segmented-control--compact'],
    className
  );
}

export function SegmentedControl<T extends string>(
  { ariaLabel, items, value, onChange, className, density = 'comfortable' }: SegmentedControlProps<T>
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { indicatorStyle, handleKeyDown } = useSegmentedControlState({ containerRef, items, value, onChange });

  return (
    <div ref={containerRef} className={segmentedControlClasses(density, className)} role="radiogroup" aria-label={ariaLabel}>
      <SegmentIndicator style={indicatorStyle} />
      <SegmentItems items={items} value={value} onChange={onChange} onKeyDown={handleKeyDown} />
    </div>
  );
}
