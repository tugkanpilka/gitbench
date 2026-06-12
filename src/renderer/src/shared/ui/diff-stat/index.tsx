import { cx } from '../cx';
import type { DiffStatProps } from './index.types';
import styles from './index.module.scss';

/** Accessible phrasing for a change count, e.g. "1 addition, 2 deletions". */
export function diffStatLabel(additions: number, deletions: number): string {
  const additionsPart = `${additions} ${additions === 1 ? 'addition' : 'additions'}`;
  const deletionsPart = `${deletions} ${deletions === 1 ? 'deletion' : 'deletions'}`;
  return `${additionsPart}, ${deletionsPart}`;
}

export function DiffStat({
  additions,
  deletions,
  onSelection = false,
  className,
  ...props
}: DiffStatProps) {
  const showAdditions = additions > 0 || deletions === 0;
  const showDeletions = deletions > 0 || additions === 0;
  const classes = cx(
    styles['gb-diff-stat'],
    onSelection && styles['gb-diff-stat--on-selection'],
    className
  );

  return (
    <span className={classes} aria-label={diffStatLabel(additions, deletions)} {...props}>
      {showAdditions && (
        <span className={styles['gb-diff-stat__add']} aria-hidden="true">
          +{additions}
        </span>
      )}
      {showDeletions && (
        <span className={styles['gb-diff-stat__delete']} aria-hidden="true">
          −{deletions}
        </span>
      )}
    </span>
  );
}
