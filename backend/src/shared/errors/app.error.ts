// src/shared/errors/app.error.ts
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    // Maintain proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
