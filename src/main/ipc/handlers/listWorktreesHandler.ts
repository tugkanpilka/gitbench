import {
  IPC_CHANNELS,
  type ListWorktreesRequest,
  type ListWorktreesResponse,
} from '../../../contracts/ipc';
import type { ApplicationServices } from '../../bootstrap/compositionRoot';
import { handle } from '../handle';
import { toWorktreeDto } from '../mappers/worktreeMapper';

export function registerListWorktreesHandler({
  listWorktrees,
}: Pick<ApplicationServices, 'listWorktrees'>): void {
  handle<ListWorktreesRequest, ListWorktreesResponse>(
    IPC_CHANNELS.listWorktrees,
    async (request) => (await listWorktrees(request.repoPath)).map(toWorktreeDto)
  );
}
