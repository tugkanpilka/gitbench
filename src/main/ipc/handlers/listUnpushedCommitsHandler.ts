import {
  IPC_CHANNELS,
  type ListUnpushedCommitsRequest,
  type ListUnpushedCommitsResponse,
} from '../../../contracts/ipc';
import type { ApplicationServices } from '../../bootstrap/compositionRoot';
import { handle } from '../handle';
import { toListUnpushedCommitsResponse } from '../mappers/commitMapper';

export function registerListUnpushedCommitsHandler({
  commitReader,
}: Pick<ApplicationServices, 'commitReader'>): void {
  // An empty commit list is a valid success state and travels as a success Result.
  handle<ListUnpushedCommitsRequest, ListUnpushedCommitsResponse>(
    IPC_CHANNELS.listUnpushedCommits,
    async (request) =>
      toListUnpushedCommitsResponse(await commitReader.listUnpushedCommits(request.worktreePath))
  );
}
