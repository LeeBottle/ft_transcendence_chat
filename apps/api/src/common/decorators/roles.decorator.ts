import { SetMetadata, type CustomDecorator } from '@nestjs/common';

import type { UserRole } from '@repo/constants/user';

export const ROLES_KEY = 'ROLES';

export function Roles(...roles: UserRole[]): CustomDecorator {
  return SetMetadata(ROLES_KEY, roles);
}
