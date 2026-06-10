import gitbenchIcon from '../../assets/gitbench-icon.svg';
import { Button } from '../../shared/ui/core';
import './welcome-screen.css';

interface Props {
  loading: boolean;
  error: string | null;
  onOpenRepository: () => void | Promise<void>;
}

export function WelcomeScreen({ loading, error, onOpenRepository }: Props) {
  return (
    <main className="welcome-screen">
      <div className="welcome-screen__drag-region" aria-hidden="true" />
      <section className="welcome-card" aria-labelledby="welcome-title" aria-busy={loading}>
        <img className="welcome-card__icon" src={gitbenchIcon} width="96" height="96" alt="" />
        <div className="welcome-card__heading">
          <h1 id="welcome-title">GitBench</h1>
          <p>Worktree diff viewer</p>
        </div>

        <p className="welcome-card__description">
          Review uncommitted changes in tracked files across Git worktrees in one place.
        </p>

        <Button
          className="welcome-card__action"
          variant="primary"
          onClick={onOpenRepository}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'Opening repository…' : 'Open Repository…'}
        </Button>

        {error && (
          <div className="welcome-card__error" role="alert">
            {error}
          </div>
        )}

        <p className="welcome-card__hint">Select a local Git repository to get started.</p>
      </section>
    </main>
  );
}
