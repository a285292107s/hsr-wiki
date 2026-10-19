
export class NkError extends Error {
  readonly operational: boolean;

  constructor(message: string, operational = true) {
    super(message);
    this.name = 'NkError';
    this.operational = operational;
  }
}

export function userErrorDetail(err: unknown): string {
  if (err instanceof NkError && err.operational) {
    console.warn('[nk] operational error:', err.message);
    return '';
  }
  return err instanceof Error ? err.message : String(err);
}
