import gitbenchIcon from '../../assets/gitbench-icon.svg';
import { Button } from '../../shared/ui/button';
import { Visibility } from '../../shared/ui/visibility';
import type { WelcomeScreenProps } from './index.types';
import styles from './index.module.scss';

export function WelcomeScreen({ loading, error, onOpenRepository }: WelcomeScreenProps) {
  return (
    <main className={styles['welcome-screen']}>
      <div className={styles['welcome-screen__drag-region']} aria-hidden="true" />
      <section
        className={styles['welcome-card']}
        aria-labelledby="welcome-title"
        aria-busy={loading}
      >
        <img
          className={styles['welcome-card__icon']}
          src={gitbenchIcon}
          width="96"
          height="96"
          alt=""
        />
        <div className={styles['welcome-card__heading']}>
          <h1 id="welcome-title">GitBench</h1>
          <p>Worktree diff viewer</p>
        </div>

        <p className={styles['welcome-card__description']}>
          Review all uncommitted changes across Git worktrees in one place.
        </p>

        <Button
          className={styles['welcome-card__action']}
          variant="primary"
          onClick={onOpenRepository}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'Opening repository…' : 'Open Repository…'}
        </Button>

        <Visibility isVisible={!!error}>
          <div className={styles['welcome-card__error']} role="alert">
            {error}
          </div>
        </Visibility>

        <p className={styles['welcome-card__hint']}>
          Select a local Git repository to get started.
        </p>
      </section>
    </main>
  );
}
