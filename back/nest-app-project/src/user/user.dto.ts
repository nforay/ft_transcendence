import { IsString, IsEmail, Length, IsNotEmpty, ValidateIf } from 'class-validator'

export class UserDTO {
  
  @IsString()
  @Length(3, 20)
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

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

export class UserResponseObject {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  token?: string;
  expiresIn?: number;
}
