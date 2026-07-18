import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface ErrorBody {
  statusCode: number;
  message: string;
  error: string;
  errors?: unknown;
  path: string;
  timestamp: string;
}

/**
 * Global exception filter producing a consistent error envelope for every
 * failure (revives the intent of the original app's unused custom handler).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'InternalServerError';
    let errors: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      error = exception.name;
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        message = this.stringifyMessage(body.message) ?? exception.message;
        error = (body.error as string) ?? error;
        if (Array.isArray(body.message)) errors = body.message;
      }
    } else if (exception instanceof QueryFailedError) {
      // Map unique-violation etc. to 409 without leaking SQL internals.
      status = HttpStatus.CONFLICT;
      error = 'QueryFailedError';
      message = 'Database constraint violation';
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ErrorBody = {
      statusCode: status,
      message,
      error,
      ...(errors ? { errors } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }

  private stringifyMessage(message: unknown): string | undefined {
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(', ');
    return undefined;
  }
}
