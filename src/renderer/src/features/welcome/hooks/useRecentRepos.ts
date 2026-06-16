import { useCallback, useEffect, useState } from 'react';

import type { RecentRepoDto } from '../../../../../contracts/ipc';
import { desktopApi } from '../../../shared/api/desktopApi';

export interface RecentReposState {
  repos: RecentRepoDto[];
  loading: boolean;
}

// eslint-disable-next-line max-lines-per-function -- three-state async fetch (loading/data/error); no meaningful split
export function useRecentRepos(): RecentReposState {
  const [repos, setRepos] = useState<RecentRepoDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await desktopApi.listRecentRepos();
      setRepos(result);
    } catch {
      setRepos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { repos, loading };
}
