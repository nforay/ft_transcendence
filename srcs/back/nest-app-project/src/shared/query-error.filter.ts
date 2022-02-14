import { ArgumentsHost, Catch, ExceptionFilter, Logger } from "@nestjs/common";
import { QueryFailedError, UpdateValuesMissingError } from "typeorm";
import { Response, Request } from 'express';

@Catch(QueryFailedError, UpdateValuesMissingError)
export class QueryErrorFilter implements ExceptionFilter {

  catch(err : QueryFailedError | UpdateValuesMissingError, host : ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const errorResponse = {
      timestamp: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(),
      path: request.url,
      method: request.method,
      message: err.message || null,
    };

    Logger.error(`${request.method} ${request.url} `, JSON.stringify(errorResponse), 'QueryErrorFilter');

    response.status(400).json(errorResponse);
  }

}
