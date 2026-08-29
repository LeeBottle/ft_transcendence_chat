import { SetMetadata, type CustomDecorator } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'IS_PUBLIC' as const;

export function Public(): CustomDecorator<typeof IS_PUBLIC_KEY> {
  return SetMetadata(IS_PUBLIC_KEY, true);
}
