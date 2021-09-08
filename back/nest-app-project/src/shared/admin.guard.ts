import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "./auth.guard";

@Injectable()
export class AdminGuard extends AuthGuard {
  async canActivate(context: ExecutionContext) {
    if (!super.canActivate(context)) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    if (!request.headers.authorization)
      return false;
    const decode = await super.verifyJWT(request.headers.authorization);
    return decode.role === 'admin';
  }
}
