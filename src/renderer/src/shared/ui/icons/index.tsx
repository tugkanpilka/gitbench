import { memo } from 'react';
import type { ReactNode } from 'react';

type TIconProps = {
  className?: string;
};

type TChevronProps = TIconProps & {
  collapsed: boolean;
};

interface IconProps {
  className?: string | undefined;
  size?: number | undefined;
  viewBox?: string | undefined;
  children: ReactNode;
  [key: string]: unknown;
}

function Icon({ className, size, viewBox, children, ...rest }: IconProps) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      width={size}
      height={size}
      viewBox={viewBox}
      {...rest}
    >
      {children}
    </svg>
  );
}

const SUN_SIZE = 14;
const SUN_CIRCLE_STROKE = 1.4;
const SUN_RAY_STROKE = 1.3;

function SunRays() {
  return (
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
  );
}

export const SunIcon = memo(function SunIcon({ className }: TIconProps) {
  return (
    <Icon className={className} size={SUN_SIZE} viewBox="0 0 14 14">
      <circle
        cx="7"
        cy="7"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth={SUN_CIRCLE_STROKE}
      />
      <SunRays />
    </Icon>
  );
});

const MOON_SIZE = 14;
const MOON_STROKE = 1.4;

export const MoonIcon = memo(function MoonIcon({ className }: TIconProps) {
  return (
    <Icon className={className} size={MOON_SIZE} viewBox="0 0 14 14">
      <path
        d="M11.5 8.6 A5 5 0 1 1 5.4 2.5 A4 4 0 0 0 11.5 8.6 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={MOON_STROKE}
        strokeLinejoin="round"
      />
    </Icon>
  );
});

const CHEVRON_SIZE = 8;
const CHEVRON_STROKE = 1.4;

export const Chevron = memo(function Chevron({ collapsed, className }: TChevronProps) {
  return (
    <Icon className={className} size={CHEVRON_SIZE} viewBox="0 0 8 8" data-collapsed={collapsed}>
      <path
        d="M2.5 1 L6 4 L2.5 7"
        fill="none"
        stroke="currentColor"
        strokeWidth={CHEVRON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
});

const WORKTREE_SIZE = 12;

export const WorktreeIcon = memo(function WorktreeIcon({ className }: TIconProps) {
  return (
    <Icon className={className} viewBox="0 0 16 16" size={WORKTREE_SIZE} fill="currentColor">
      <path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 3 2.122v5.256a2.25 2.25 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 9.5 3.25ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0ZM4.25 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0Z" />
    </Icon>
  );
});

export const TreeListIcon = memo(function TreeListIcon({ className }: TIconProps) {
  return (
    <Icon className={className} size={14} viewBox="0 0 14 14" fill="currentColor">
      <rect x="2" y="2.75" width="10" height="1.5" rx="0.5" />
      <rect x="4" y="6.25" width="8" height="1.5" rx="0.5" />
      <rect x="6" y="9.75" width="6" height="1.5" rx="0.5" />
    </Icon>
  );
});

export const FlatListIcon = memo(function FlatListIcon({ className }: TIconProps) {
  return (
    <Icon className={className} size={14} viewBox="0 0 14 14" fill="currentColor">
      <rect x="2" y="2.75" width="10" height="1.5" rx="0.5" />
      <rect x="2" y="6.25" width="10" height="1.5" rx="0.5" />
      <rect x="2" y="9.75" width="10" height="1.5" rx="0.5" />
    </Icon>
  );
});
