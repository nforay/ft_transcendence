import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(HttpException)
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const code = exception.getStatus() || 500;

    const errorResponse = {
      code: code,
      timestamp: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(),
      path: request.url,
      method: request.method,
      message: exception.message || null,
    };

    Logger.error(`${request.method} ${request.url} `, JSON.stringify(errorResponse), 'HttpErrorFilter');

    response.status(code).json(errorResponse);
  }
}
