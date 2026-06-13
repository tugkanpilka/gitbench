import {
  IPC_CHANNELS,
  type ListWorktreeSummariesRequest,
  type ListWorktreeSummariesResponse,
} from '../../../contracts/ipc';
import type { ApplicationServices } from '../../bootstrap/compositionRoot';
import { handle } from '../handle';
import { toWorktreeSummaryDto } from '../mappers/worktreeSummaryMapper';

export function registerListWorktreeSummariesHandler({
  worktreeSummaryReader,
}: Pick<ApplicationServices, 'worktreeSummaryReader'>): void {
  handle<ListWorktreeSummariesRequest, ListWorktreeSummariesResponse>(
    IPC_CHANNELS.listWorktreeSummaries,
    async (request) =>
      (await worktreeSummaryReader.listWorktreeSummaries(request.worktreePaths)).map(
        toWorktreeSummaryDto
      )
  );
}
