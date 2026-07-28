abstract class BaseEnvError extends Error {
  protected constructor(context: string, details: string) {
    super(`[${context}] Validation failure\n${details}`);

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ApiEnvError extends BaseEnvError {
  constructor(details: string) {
    super('ConfigModule', details);
  }
}

// Only TypeORM CLI
export class DatabaseEnvError extends BaseEnvError {
  constructor(details: string) {
    super('TypeORM CLI', details);
  }
}
