import type { ErrorDto } from '../../../../contracts/ipc';

export class ApiError extends Error {
  constructor(
    public readonly code: ErrorDto['code'],
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
