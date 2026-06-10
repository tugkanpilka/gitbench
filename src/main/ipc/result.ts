import type { Result } from '../../contracts/ipc';
import { toErrorDto } from './mappers/errorMapper';

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail<T>(error: unknown): Result<T> {
  return { ok: false, error: toErrorDto(error) };
}
