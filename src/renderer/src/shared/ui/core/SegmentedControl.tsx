import { type KeyboardEvent, useLayoutEffect, useRef, useState } from 'react';

import './core.css';

export interface SegmentedControlItem<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  ariaLabel: string;
  items: readonly SegmentedControlItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

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
  const classes = ['gb-segmented-control', className].filter(Boolean).join(' ');
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  } | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return;
    }

    const selectedIndex = items.findIndex((item) => item.value === value);
    if (selectedIndex === -1) {
      setIndicatorStyle(null);
      return;
    }

    const buttons = container.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    const selectedButton = buttons[selectedIndex];
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
    const nextItem = items[nextIndex];
    onChange(nextItem.value);

    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
      '[role="radio"]'
    );
    buttons?.[nextIndex]?.focus();
  };

  return (
    <div ref={containerRef} className={classes} role="radiogroup" aria-label={ariaLabel}>
      {indicatorStyle !== null && (
        <span
          className="gb-segmented-control__indicator"
          aria-hidden="true"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
      )}
      {items.map((item, index) => {
        const selected = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            className="gb-segmented-control__item"
            role="radio"
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
