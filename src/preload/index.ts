// The ONLY file where ipcRenderer appears. Exposed surface: agent_docs/ipc-contract.md.
import { contextBridge, ipcRenderer } from 'electron';

import {
  IPC_CHANNELS,
  type DesktopApi,
  type GetDiffResponse,
  type ListWorktreesResponse,
  type PickRepositoryResponse,
  type Result,
} from '../contracts/ipc';

const api: DesktopApi = {
  pickRepo: (): Promise<Result<PickRepositoryResponse>> =>
    ipcRenderer.invoke(IPC_CHANNELS.pickRepository),
  listWorktrees: (repoPath: string): Promise<Result<ListWorktreesResponse>> =>
    ipcRenderer.invoke(IPC_CHANNELS.listWorktrees, { repoPath }),
  getDiff: (worktreePath: string): Promise<Result<GetDiffResponse>> =>
    ipcRenderer.invoke(IPC_CHANNELS.getDiff, { worktreePath }),
};

contextBridge.exposeInMainWorld('api', api);
