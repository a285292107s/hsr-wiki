
export class NkError extends Error {
  readonly operational: boolean;

  constructor(message: string, operational = true) {
    super(message);
    this.name = 'NkError';
    this.operational = operational;
  }
}
