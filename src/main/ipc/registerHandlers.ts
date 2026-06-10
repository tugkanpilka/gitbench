import type { ApplicationServices } from '../bootstrap/compositionRoot';
import { registerGetDiffHandler } from './handlers/getDiffHandler';
import { registerListWorktreesHandler } from './handlers/listWorktreesHandler';
import { registerPickRepositoryHandler } from './handlers/pickRepositoryHandler';

export function registerHandlers(services: ApplicationServices): void {
  registerPickRepositoryHandler();
  registerListWorktreesHandler(services);
  registerGetDiffHandler(services);
}
