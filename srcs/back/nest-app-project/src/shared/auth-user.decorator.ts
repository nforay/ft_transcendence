import { createParamDecorator, ExecutionContext, HttpException, HttpStatus } from "@nestjs/common";
import * as jwt from 'jsonwebtoken'

export const AuthUser = createParamDecorator((_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  if (!request.headers.authorization)
    return false;

  const parts = request.headers.authorization.split(" ");
  if (parts.length !== 2)
    return false;
  const scheme = parts[0];
  const token = parts[1];
  if (scheme !== "Bearer")
    throw new HttpException('Invalid Authorization Scheme', HttpStatus.UNAUTHORIZED);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    throw new HttpException('Invalid Token', HttpStatus.UNAUTHORIZED);
  }
})
