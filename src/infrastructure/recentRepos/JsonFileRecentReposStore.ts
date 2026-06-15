import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { RecentRepoRecord } from './recentRepoRecord';
import type { RecentReposStore } from './RecentReposStore';

const MAX_ENTRIES = 10;
const FILE_NAME = 'recent-repos.json';

export class JsonFileRecentReposStore implements RecentReposStore {
  private readonly filePath: string;
  private pendingWrite: Promise<void> = Promise.resolve();

  constructor(userDataPath: string) {
    this.filePath = join(userDataPath, FILE_NAME);
  }

  async add(repoPath: string): Promise<void> {
    this.pendingWrite = this.pendingWrite.then(() => this.writeAdd(repoPath));
    await this.pendingWrite;
  }

  async list(): Promise<RecentRepoRecord[]> {
    try {
      const raw = await readFile(this.filePath, 'utf-8');
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isRecentRepoRecord);
    } catch {
      return [];
    }
  }

  private async writeAdd(repoPath: string): Promise<void> {
    const existing = await this.list();
    const without = existing.filter((r) => r.repoPath !== repoPath);
    const next: RecentRepoRecord[] = [
      { repoPath, openedAt: new Date().toISOString() },
      ...without,
    ].slice(0, MAX_ENTRIES);
    try {
      await writeFile(this.filePath, JSON.stringify(next), 'utf-8');
    } catch {
      // Storage failure must not surface to the user.
    }
  }
}

function isRecentRepoRecord(value: unknown): value is RecentRepoRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).repoPath === 'string' &&
    typeof (value as Record<string, unknown>).openedAt === 'string'
  );
}
