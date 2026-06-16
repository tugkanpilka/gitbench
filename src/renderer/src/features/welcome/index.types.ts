import type { RecentRepoDto } from '../../../../contracts/ipc';

export type WelcomeScreenProps = {
  loading: boolean;
  error: string | null;
  onOpenRepository: () => void | Promise<void>;
  recentRepos: {
    items: RecentRepoDto[];
    loading: boolean;
    onOpen: (repoPath: string) => void;
  };
};
