import type { ApplicationServices } from '../bootstrap/compositionRoot';
import { registerGetDiffHandler } from './handlers/getDiffHandler';
import { registerListUnpushedCommitsHandler } from './handlers/listUnpushedCommitsHandler';
import { registerListWorktreeSummariesHandler } from './handlers/listWorktreeSummariesHandler';
import { registerListWorktreesHandler } from './handlers/listWorktreesHandler';
import { registerPickRepositoryHandler } from './handlers/pickRepositoryHandler';
import { registerWatchHandlers } from './handlers/watchHandlers';
import type { WatchController } from './watchController';

export function registerHandlers(
  services: ApplicationServices,
  watchController: WatchController
): void {
  registerPickRepositoryHandler();
  registerListWorktreesHandler(services);
  registerListWorktreeSummariesHandler(services);
  registerGetDiffHandler(services);
  registerListUnpushedCommitsHandler(services);
  registerWatchHandlers(watchController);
}
