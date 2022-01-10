import { IsString, Length, IsNotEmpty, ValidateIf, IsUUID, IsNumberString, isAlphanumeric, IsAlphanumeric } from 'class-validator'

export class UserPassDTO {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 32)
  password: string;
}

export class UserDTO {
  
  @IsString()
  @Length(3, 20)
  @IsNotEmpty()
  @IsAlphanumeric()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 32)
  password: string;

  @IsString()
  role: string;

  @IsString()
  @Length(0, 400)
  bio: string;
}

export class SecretCodeDTO {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @IsNumberString()
  code: string;
}

export class UserResponseObject {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  elo: number;
  win: number;
  lose: number;
  has2FA?: boolean;
  token?: string;
  expiresIn?: number;
}
