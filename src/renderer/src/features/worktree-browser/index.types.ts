import type { CommitDto } from '../../../../contracts/ipc';

export type DiffState = {
  worktreePath: string;
  diffText: string;
};

export type CommitsState = {
  commits: CommitDto[];
  truncated: boolean;
};
