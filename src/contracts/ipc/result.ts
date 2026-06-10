import type { ErrorDto } from './errors';

export type Result<T> = { ok: true; data: T } | { ok: false; error: ErrorDto };
