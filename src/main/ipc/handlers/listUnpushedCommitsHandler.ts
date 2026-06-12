import {
  IPC_CHANNELS,
  type ListUnpushedCommitsRequest,
  type ListUnpushedCommitsResponse,
} from '../../../contracts/ipc';
import type { ApplicationServices } from '../../bootstrap/compositionRoot';
import { handle } from '../handle';
import { toListUnpushedCommitsResponse } from '../mappers/commitMapper';

export function registerListUnpushedCommitsHandler({
  listUnpushedCommits,
}: Pick<ApplicationServices, 'listUnpushedCommits'>): void {
  // An empty commit list is a valid success state and travels as a success Result.
  handle<ListUnpushedCommitsRequest, ListUnpushedCommitsResponse>(
    IPC_CHANNELS.listUnpushedCommits,
    async (request) =>
      toListUnpushedCommitsResponse(await listUnpushedCommits(request.worktreePath))
  );
}
