import type { TProps } from './index.types';
import styles from '../index.module.scss';

const INDENT_STEP_PX = 12;
const ROW_BASE_PADDING_PX = 6;
const GUIDE_BASE_OFFSET_PX = 13;

export function treeRowIndent(depth: number): string {
  return `${ROW_BASE_PADDING_PX + depth * INDENT_STEP_PX}px`;
}

export function IndentGuides({ depth }: TProps) {
  if (depth === 0) return null;
  const guides = [];
  for (let i = 0; i < depth; i++) {
    guides.push(
      <span
        key={i}
        className={styles['file-tree-guide']}
        aria-hidden="true"
        style={{ left: `${GUIDE_BASE_OFFSET_PX + i * INDENT_STEP_PX}px` }}
      />
    );
  }
  return <>{guides}</>;
}
