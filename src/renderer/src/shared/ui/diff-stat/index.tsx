import type { TProps } from './index.types';
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
}: TProps) {
  const classes = [styles['gb-diff-stat'], onSelection && styles['gb-diff-stat--on-selection'], className]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      aria-label={diffStatLabel(additions, deletions)}
      {...props}
    >
      <span className={styles['gb-diff-stat__add']} aria-hidden="true">
        +{additions}
      </span>
      <span className={styles['gb-diff-stat__delete']} aria-hidden="true">
        −{deletions}
      </span>
    </span>
  );
}
