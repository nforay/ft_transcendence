import { CallHandler, ExecutionContext, Logger, NestInterceptor } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { Observable, tap } from 'rxjs'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) : Observable<any> {
    const request = context.switchToHttp().getRequest();
    const now = Date.now();

    return next.handle().pipe(tap(() => Logger.log(`${request.method} ${request.url} ${Date.now() - now}ms`, context.getClass().name)));
  }
}
