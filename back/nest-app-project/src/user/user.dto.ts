import { IsString, IsEmail, Length } from 'class-validator'


export class UserDTO {

  @IsString()
  @Length(3, 20)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 32)
  password: string;

  @IsString()
  role: string;

  @IsString()
  @Length(0, 1000)
  bio: string;
}

export class UserResponseObject {
  id: string;
  name: string;
  role: string;
  bio: string;
  token?: string;
}
