import type { AuthenticatedUser } from '@repo/schemas/auth';

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
  }
}
