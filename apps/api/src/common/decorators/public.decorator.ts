import { SetMetadata, type CustomDecorator } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'IS_PUBLIC';

export function Public(): CustomDecorator {
  return SetMetadata(IS_PUBLIC_KEY, true);
}
