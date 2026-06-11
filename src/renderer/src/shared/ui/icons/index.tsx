import { memo } from 'react';

type TIconProps = {
  className?: string;
};

type TChevronProps = TIconProps & {
  collapsed: boolean;
};

const SIDEBAR_WIDTH = 17;
const SIDEBAR_HEIGHT = 14;
const SIDEBAR_STROKE = 1.2;

export const SidebarIcon = memo(function SidebarIcon({ className }: TIconProps) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      width={SIDEBAR_WIDTH}
      height={SIDEBAR_HEIGHT}
      viewBox="0 0 17 14"
    >
      <rect
        x="0.5"
        y="0.5"
        width="16"
        height="13"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth={SIDEBAR_STROKE}
      />
      <line x1="6" y1="1" x2="6" y2="13" stroke="currentColor" strokeWidth={SIDEBAR_STROKE} />
    </svg>
  );
});

const SUN_SIZE = 14;
const SUN_CIRCLE_STROKE = 1.4;
const SUN_RAY_STROKE = 1.3;

export const SunIcon = memo(function SunIcon({ className }: TIconProps) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      width={SUN_SIZE}
      height={SUN_SIZE}
      viewBox="0 0 14 14"
    >
      <circle
        cx="7"
        cy="7"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth={SUN_CIRCLE_STROKE}
      />
      <g stroke="currentColor" strokeWidth={SUN_RAY_STROKE} strokeLinecap="round">
        <line x1="7" y1="0.8" x2="7" y2="2.4" />
        <line x1="11.4" y1="2.6" x2="10.2" y2="3.8" />
        <line x1="13.2" y1="7" x2="11.6" y2="7" />
        <line x1="11.4" y1="11.4" x2="10.2" y2="10.2" />
        <line x1="7" y1="13.2" x2="7" y2="11.6" />
        <line x1="2.6" y1="11.4" x2="3.8" y2="10.2" />
        <line x1="0.8" y1="7" x2="2.4" y2="7" />
        <line x1="2.6" y1="2.6" x2="3.8" y2="3.8" />
      </g>
    </svg>
  );
});

const MOON_SIZE = 14;
const MOON_STROKE = 1.4;

export const MoonIcon = memo(function MoonIcon({ className }: TIconProps) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      width={MOON_SIZE}
      height={MOON_SIZE}
      viewBox="0 0 14 14"
    >
      <path
        d="M11.5 8.6 A5 5 0 1 1 5.4 2.5 A4 4 0 0 0 11.5 8.6 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={MOON_STROKE}
        strokeLinejoin="round"
      />
    </svg>
  );
});

const CHEVRON_SIZE = 8;
const CHEVRON_STROKE = 1.4;

export const Chevron = memo(function Chevron({ collapsed, className }: TChevronProps) {
  return (
    <svg
      className={className}
      data-collapsed={collapsed}
      width={CHEVRON_SIZE}
      height={CHEVRON_SIZE}
      viewBox="0 0 8 8"
      aria-hidden="true"
    >
      <path
        d="M2.5 1 L6 4 L2.5 7"
        fill="none"
        stroke="currentColor"
        strokeWidth={CHEVRON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

const WORKTREE_SIZE = 12;

export const WorktreeIcon = memo(function WorktreeIcon({ className }: TIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      width={WORKTREE_SIZE}
      height={WORKTREE_SIZE}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 3 2.122v5.256a2.25 2.25 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 9.5 3.25ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0ZM4.25 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0Z" />
    </svg>
  );
});
