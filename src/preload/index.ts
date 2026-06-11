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
  startWatch: (repoPath: string, selectedWorktreePath: string | null): Promise<Result<null>> =>
    ipcRenderer.invoke(IPC_CHANNELS.startWatch, { repoPath, selectedWorktreePath }),
  stopWatch: (): Promise<Result<null>> => ipcRenderer.invoke(IPC_CHANNELS.stopWatch),
  onRepoChanged: (listener: () => void): (() => void) => {
    // Strip Electron's IpcRendererEvent — the renderer gets a bare "re-query" signal,
    // not a structured-clone-unsafe event object. Keep the wrapper reference so the
    // returned unsubscribe removes exactly this listener.
    const wrapped = (): void => listener();
    ipcRenderer.on(IPC_CHANNELS.repoChanged, wrapped);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.repoChanged, wrapped);
    };
  },
};

contextBridge.exposeInMainWorld('api', api);
