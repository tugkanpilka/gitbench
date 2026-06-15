import { cx } from '../cx';
import { Visibility } from '../visibility';
import type { DiffStatProps } from './index.types';
import styles from './index.module.scss';

/** Accessible phrasing for a change count, e.g. "1 addition, 2 deletions". */
export function diffStatLabel(additions: number, deletions: number): string {
  const additionsPart = `${additions} ${additions === 1 ? 'addition' : 'additions'}`;
  const deletionsPart = `${deletions} ${deletions === 1 ? 'deletion' : 'deletions'}`;
  return `${additionsPart}, ${deletionsPart}`;
}

function AddCount({ additions }: { additions: number }) {
  return (
    <span className={styles['gb-diff-stat__add']} aria-hidden="true">
      +{additions}
    </span>
  );
}

function DeleteCount({ deletions }: { deletions: number }) {
  return (
    <span className={styles['gb-diff-stat__delete']} aria-hidden="true">
      −{deletions}
    </span>
  );
}

function DiffStatCounts({ additions, deletions }: { additions: number; deletions: number }) {
  const showAdditions = additions > 0 || deletions === 0;
  const showDeletions = deletions > 0 || additions === 0;
  return (
    <>
      <Visibility isVisible={showAdditions}>
        <AddCount additions={additions} />
      </Visibility>
      <Visibility isVisible={showDeletions}>
        <DeleteCount deletions={deletions} />
      </Visibility>
    </>
  );
}

function diffStatClasses(onSelection: boolean, emphasis: string, className?: string) {
  return cx(
    styles['gb-diff-stat'],
    onSelection && styles['gb-diff-stat--on-selection'],
    emphasis === 'muted' && styles['gb-diff-stat--muted'],
    className
  );
}

// eslint-disable-next-line max-lines-per-function -- pure JSX render; already decomposed into AddCount/DeleteCount/DiffStatCounts helpers
export function DiffStat({
  additions,
  deletions,
  onSelection = false,
  emphasis = 'default',
  className,
  ...props
}: DiffStatProps) {
  return (
    <span
      className={diffStatClasses(onSelection, emphasis, className)}
      aria-label={diffStatLabel(additions, deletions)}
      {...props}
    >
      <DiffStatCounts additions={additions} deletions={deletions} />
    </span>
  );
}
