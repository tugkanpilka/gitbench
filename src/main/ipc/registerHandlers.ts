import type { ApplicationServices } from '../bootstrap/compositionRoot';
import { registerGetDiffHandler } from './handlers/getDiffHandler';
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
  registerGetDiffHandler(services);
  registerWatchHandlers(watchController);
}
