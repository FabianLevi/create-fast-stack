import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppException } from '../exceptions/app.exception';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  constructor(private logger: Logger) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const requestId = (request.headers['x-request-id'] || 'unknown') as string;
    const timestamp = new Date().toISOString();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
          ? (exceptionResponse as any).message
          : exception.message;
    } else if (exception instanceof AppException) {
      statusCode = exception.statusCode;
      message = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      {
        statusCode,
        message,
        requestId,
        exception,
      },
      `[${requestId}] Exception occurred`,
    );

    response.status(statusCode).json({
      statusCode,
      message,
      requestId,
      timestamp,
    });
  }
}
