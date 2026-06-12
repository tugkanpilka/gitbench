import type { CommitDto } from '../../../../../contracts/ipc';

export type UnpushedCommitsSectionProps = {
  commits: CommitDto[];
  /** True when the commit list was capped on the main side. */
  truncated: boolean;
};
