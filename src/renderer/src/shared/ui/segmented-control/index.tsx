import { type KeyboardEvent, useLayoutEffect, useRef, useState } from 'react';
import { cx } from '../cx';
import type { SegmentedControlProps, SegmentedControlItem } from './index.types';
import styles from './index.module.scss';

function nextEnabledIndex<T extends string>(
  items: readonly SegmentedControlItem<T>[],
  currentIndex: number,
  direction: 1 | -1
): number {
  for (let offset = 1; offset <= items.length; offset += 1) {
    const candidate = (currentIndex + direction * offset + items.length) % items.length;
    if (!items[candidate].disabled) {
      return candidate;
    }
  }
  return currentIndex;
}

export function SegmentedControl<T extends string>({
  ariaLabel,
  items,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const classes = cx(styles['gb-segmented-control'], className);
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  } | null>(null);

  const radioButtons = (): NodeListOf<HTMLButtonElement> | undefined =>
    containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');

  useLayoutEffect(() => {
    const selectedIndex = items.findIndex((item) => item.value === value);
    if (selectedIndex === -1) {
      setIndicatorStyle(null);
      return;
    }

    const selectedButton = radioButtons()?.[selectedIndex];
    if (selectedButton === undefined) {
      setIndicatorStyle(null);
      return;
    }

    setIndicatorStyle({
      left: selectedButton.offsetLeft,
      width: selectedButton.offsetWidth,
    });
  }, [items, value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let direction: 1 | -1 | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      direction = 1;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      direction = -1;
    }

    if (direction === null || items.length === 0) {
      return;
    }

    event.preventDefault();
    const nextIndex = nextEnabledIndex(items, index, direction);
    onChange(items[nextIndex].value);
    radioButtons()?.[nextIndex]?.focus();
  };

  return (
    <div ref={containerRef} className={classes} role="radiogroup" aria-label={ariaLabel}>
      {indicatorStyle !== null && (
        <span
          className={styles['gb-segmented-control__indicator']}
          aria-hidden="true"
          style={indicatorStyle}
        />
      )}
      {items.map((item, index) => {
        const selected = item.value === value;
        const buttonAriaLabel =
          item.ariaLabel ?? (typeof item.label === 'string' ? item.label : undefined);

        return (
          <button
            key={item.value}
            type="button"
            className={styles['gb-segmented-control__item']}
            role="radio"
            aria-label={buttonAriaLabel}
            aria-checked={selected}
            disabled={item.disabled}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
