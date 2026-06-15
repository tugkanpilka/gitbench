import gitbenchIcon from '../../assets/gitbench-icon.svg';
import { Button } from '../../shared/ui/button';
import { Visibility } from '../../shared/ui/visibility';
import { RecentRepoList } from './RecentRepoList';
import type { WelcomeScreenProps } from './index.types';
import styles from './index.module.scss';

function WelcomeIcon() {
  return (
    <img
      className={styles['welcome-card__icon']}
      src={gitbenchIcon}
      width="96"
      height="96"
      alt=""
    />
  );
}

function WelcomeHeading() {
  return (
    <div className={styles['welcome-card__heading']}>
      <h1 id="welcome-title">GitBench</h1>
      <p>Worktree diff viewer</p>
    </div>
  );
}

// eslint-disable-next-line max-lines-per-function -- pure JSX render; multi-line destructure + multi-line Button props inflate count
function WelcomeOpenButton({
  loading,
  onOpenRepository,
}: Pick<WelcomeScreenProps, 'loading' | 'onOpenRepository'>) {
  const label = loading ? 'Opening repository…' : 'Open Repository…';

  return (
    <Button
      className={styles['welcome-card__action']}
      variant="primary"
      onClick={onOpenRepository}
      disabled={loading}
      aria-busy={loading}
    >
      {label}
    </Button>
  );
}

function WelcomeError({ error }: Pick<WelcomeScreenProps, 'error'>) {
  return (
    <Visibility isVisible={!!error}>
      <div className={styles['welcome-card__error']} role="alert">
        {error}
      </div>
    </Visibility>
  );
}

function WelcomePanel({ loading, error, onOpenRepository }: Omit<WelcomeScreenProps, 'recentRepos'>) {
  return (
    <section className={styles['welcome-card']} aria-labelledby="welcome-title" aria-busy={loading}>
      <WelcomeIcon />
      <WelcomeHeading />
      <WelcomeOpenButton loading={loading} onOpenRepository={onOpenRepository} />
      <WelcomeError error={error} />
    </section>
  );
}

export function WelcomeScreen({ loading, error, onOpenRepository, recentRepos }: WelcomeScreenProps) {
  return (
    <main className={styles['welcome-screen']}>
      <div className={styles['welcome-screen__drag-region']} aria-hidden="true" />
      <WelcomePanel loading={loading} error={error} onOpenRepository={onOpenRepository} />
      <RecentRepoList
        repos={recentRepos.items}
        loading={recentRepos.loading}
        onOpen={recentRepos.onOpen}
      />
    </main>
  );
}
