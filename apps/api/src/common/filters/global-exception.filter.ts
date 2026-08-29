// import {
//   Catch,
//   HttpException,
//   HttpStatus,
//   Logger,
//   type ArgumentsHost,
//   type ExceptionFilter,
// } from '@nestjs/common';

// import type { Request, Response } from 'express';

// export interface ValidationErrorDetail {
//   field: string;
//   message: string;
//   code: string;
// }

// export interface StandardErrorResponse {
//   statusCode: number;
//   timestamp: string;
//   path: string;
//   method: string;
//   error: string;
//   message: string;
//   details?: ValidationErrorDetail[] | unknown;
// }

// interface CustomHttpExceptionResponse {
//   statusCode?: number
//   error?: string;
//   message?: string | string[];
//   errors?: ValidationErrorDetail[];
//   [key: string]: unknown;
// }

// @Catch()
// export class GlobalExceptionFilter implements ExceptionFilter {
//   private readonly logger = new Logger(GlobalExceptionFilter.name);

//   catch(exception: unknown, host: ArgumentsHost): void {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse<Response>();
//     const request = ctx.getRequest<Request>();

//     const { statusCode, error, message, details } = this.extractExceptionInfo(exception);

//     const errorResponse: StandardErrorResponse = {
//       statusCode,
//       timestamp: new Date().toISOString(),
//       path: request.originalUrl,
//       method: request.method,
//       error,
//       message,
//       ...(details !== undefined ? { details } : {}),
//     };

//     this.logException(request, errorResponse, exception);

//     response.status(statusCode).json(errorResponse);
//   }

//   private extractExceptionInfo(exception: unknown): {
//     statusCode: number;
//     error: string;
//     message: string;
//     details?: unknown;
//   } {
//     // 1. NestJS HttpException 계열 (ZodValidationPipe의 BadRequestException 포함)
//     if (exception instanceof HttpException) {
//       const statusCode = exception.getStatus();
//       const rawResponse = exception.getResponse();

//       if (typeof rawResponse === 'object' && rawResponse !== null) {
//         const customResponse = rawResponse as CustomHttpExceptionResponse;

//         return {
//           statusCode,
//           error: customResponse.error ?? exception.name,
//           message:
//             typeof customResponse.message === 'string' ? customResponse.message : exception.message,
//           // ZodValidationPipe가 전달한 errors 배열 바인딩
//           details: customResponse.errors ?? undefined,
//         };
//       }

//       return {
//         statusCode,
//         error: exception.name,
//         message: typeof rawResponse === 'string' ? rawResponse : exception.message,
//       };
//     }

//     // 2. 예측하지 못한 런타임 서버 에러 (500 Internal Server Error)
//     if (exception instanceof Error) {
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         error: 'Internal Server Error',
//         message: 'Internal server error occurred',
//       };
//     }

//     // 3. Error 객체가 아닌 예외가 던져진 경우
//     return {
//       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//       error: 'Internal Server Error',
//       message: 'Unknown error occurred',
//     };
//   }

//   private logException(
//     request: Request,
//     errorResponse: StandardErrorResponse,
//     exception: unknown,
//   ): void {
//     const { statusCode, method, path, error, message } = errorResponse;
//     const logPrefix = `[${method}] ${path} ${statusCode} - ${error}: ${message}`;

//     if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
//       const stack = exception instanceof Error ? exception.stack : undefined;

//       this.logger.error(logPrefix, stack);

//       return;
//     }

//     if (statusCode >= HttpStatus.BAD_REQUEST) {
//       this.logger.warn(
//         `${logPrefix}${
//           errorResponse.details ? ` | Details: ${JSON.stringify(errorResponse.details)}` : ''
//         }`,
//       );
//     }
//   }
// }
