import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (!request.headers.authorization)
      return false;
    const decode = await this.verifyJWT(request.headers.authorization);
    return true;
  }

  async verifyJWT(auth: string) {
    const parts = auth.split(" ");
    if (parts.length !== 2)
      return false;
    const scheme = parts[0];
    const token = parts[1];
    if (scheme !== "Bearer")
      throw new HttpException('Invalid Authorization Scheme', HttpStatus.UNAUTHORIZED);

    try {
      const decoded = await jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (err) {
      throw new HttpException('Invalid Token', HttpStatus.UNAUTHORIZED);
    }
  }
}
