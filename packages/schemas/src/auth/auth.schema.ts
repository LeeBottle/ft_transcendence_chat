import { z } from 'zod';

import { createStringFieldSchema, validateNestedSchema } from '#common/utils.js';
import {
  createdAtSchema,
  createEmailSchema,
  createLoginIdSchema,
  createNameSchema,
  createProfileImagePathSchema,
  emailVerifiedAtSchema,
  roleSchema,
  statusSchema,
  USER_REQUEST_VALIDATION_OPTIONS,
  USER_RESPONSE_VALIDATION_OPTIONS,
} from '#user/user.schema.js';

import { AUTH_CONFIGS, AUTH_REQUEST_VALIDATION_OPTIONS } from './auth.config.js';

export {
  /* For UX */
  PASSWORD_ALLOWED_REGEX,
} from './auth.config.js';

export const registerUserRequestSchema = z
  .object({
    loginId: createLoginIdSchema(USER_REQUEST_VALIDATION_OPTIONS.loginId),
    password: createPasswordSchema(),
    passwordConfirm: createPasswordConfirmSchema(),
    name: createNameSchema(USER_REQUEST_VALIDATION_OPTIONS.name),
    email: createEmailSchema(USER_REQUEST_VALIDATION_OPTIONS.email),
  })
  .superRefine(({ password, passwordConfirm }, ctx) => {
    if (password !== passwordConfirm) {
      ctx.addIssue({
        code: 'custom',
        message: '비밀번호와 비밀번호 확인이 일치하지 않습니다.',
        path: ['passwordConfirm'],
      });
    }
  });
export type RegisterUserRequest = z.infer<typeof registerUserRequestSchema>;

export const registerUserResponseSchema = z.object({
  loginId: createLoginIdSchema(USER_RESPONSE_VALIDATION_OPTIONS.loginId),
  email: createEmailSchema(USER_RESPONSE_VALIDATION_OPTIONS.email),
  createdAt: createdAtSchema,
});
export type RegisterUserResponse = z.infer<typeof registerUserResponseSchema>;

export const loginUserRequestSchema = z
  .object({
    loginId: createLoginIdSchema(USER_REQUEST_VALIDATION_OPTIONS.loginId),
    password: createPasswordSchema(),
  })
  .superRefine((data, ctx) => {
    if (
      !validateNestedSchema(
        ctx,
        z.string().trim().min(1, '아이디를 입력해 주세요.'),
        data.loginId,
        ['loginId'],
      )
    ) {
      return;
    }

    if (
      !validateNestedSchema(
        ctx,
        z.string().trim().min(1, '비밀번호를 입력해 주세요.'),
        data.password,
        ['password'],
      )
    ) {
      return;
    }

    // const loginIdAllowedCharsSchema = z
    //   .string()
    //   .regex(/^$/, "아이디에는 영문 소문자, 숫자, 언더바('_')만 입력할 수 있어요.");

    // if (!validateNestedSchema(ctx, loginIdAllowedCharsSchema, data.loginId, ['loginId'])) {
    //   return;
    // }

    // if (
    //   data.loginId.length < 4 ||
    //   data.loginId.length > 20 ||
    //   data.password.length < 8 ||
    //   data.password.length > 100 ||
    //   !PASSWORD_FORMAT_REGEX.test(data.password)
    // ) {
    //   ctx.addIssue({ code: 'custom', message: LOGIN_FAIL_MESSAGE });
    // }
  });
export type LoginUserRequest = z.infer<typeof loginUserRequestSchema>;

export const loginUserResponseSchema = z.object({
  loginId: createLoginIdSchema(USER_RESPONSE_VALIDATION_OPTIONS.loginId),
  name: createNameSchema(USER_RESPONSE_VALIDATION_OPTIONS.name),
  email: createEmailSchema(USER_RESPONSE_VALIDATION_OPTIONS.email),
  emailVerifiedAt: emailVerifiedAtSchema,
  role: roleSchema,
  status: statusSchema,
  profileImagePath: createProfileImagePathSchema(),
});
export type LoginUserResponse = z.infer<typeof loginUserResponseSchema>;

/* 요청 전용 */

function createPasswordSchema(): z.ZodType<string> {
  return createStringFieldSchema(AUTH_CONFIGS.password, AUTH_REQUEST_VALIDATION_OPTIONS.password);
}

function createPasswordConfirmSchema(): z.ZodType<string> {
  return createStringFieldSchema(
    AUTH_CONFIGS.passwordConfirm,
    AUTH_REQUEST_VALIDATION_OPTIONS.passwordConfirm,
  );
}
