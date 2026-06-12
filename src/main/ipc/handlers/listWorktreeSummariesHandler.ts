import {
  IPC_CHANNELS,
  type ListWorktreeSummariesRequest,
  type ListWorktreeSummariesResponse,
} from '../../../contracts/ipc';
import type { ApplicationServices } from '../../bootstrap/compositionRoot';
import { handle } from '../handle';
import { toWorktreeSummaryDto } from '../mappers/worktreeSummaryMapper';

export function registerListWorktreeSummariesHandler({
  listWorktreeSummaries,
}: Pick<ApplicationServices, 'listWorktreeSummaries'>): void {
  handle<ListWorktreeSummariesRequest, ListWorktreeSummariesResponse>(
    IPC_CHANNELS.listWorktreeSummaries,
    async (request) =>
      (await listWorktreeSummaries(request.worktreePaths)).map(toWorktreeSummaryDto)
  );
}
