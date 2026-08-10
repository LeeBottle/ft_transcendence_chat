import { z } from 'zod';

import { UserRole, UserStatus } from '@repo/types/user';

import type { StringValidationOptions } from '#common/types.js';
import { createStringFieldSchema } from '#common/utils.js';

import { USER_CONFIGS, USER_RESPONSE_VALIDATION_OPTIONS } from './user.config.js';

export {
  USER_REQUEST_VALIDATION_OPTIONS,

  /* For UX */
  LOGIN_ID_ALLOWED_REGEX,
} from './user.config.js';

export { USER_RESPONSE_VALIDATION_OPTIONS };

/* 요청 & 응답 공용 */

export function createLoginIdSchema(options?: StringValidationOptions): z.ZodType<string> {
  return createStringFieldSchema(USER_CONFIGS.loginId, options);
}

export function createNameSchema(options?: StringValidationOptions): z.ZodType<string> {
  return createStringFieldSchema(USER_CONFIGS.name, options);
}

export function createEmailSchema(options?: StringValidationOptions): z.ZodType<string> {
  return createStringFieldSchema(USER_CONFIGS.email, options);
}

/* 응답 전용 */

export function createProfileImagePathSchema(): z.ZodType<string | null> {
  return createStringFieldSchema(
    USER_CONFIGS.profileImagePath,
    USER_RESPONSE_VALIDATION_OPTIONS.profileImagePath,
  );
}

export const idSchema = z.string().regex(USER_CONFIGS.id.constraints.fullRegex);
export const emailVerifiedAtSchema = z.iso.datetime().nullable();
export const roleSchema = z.enum(UserRole);
export const statusSchema = z.literal(UserStatus.ACTIVE);
export const createdAtSchema = z.iso.datetime();
