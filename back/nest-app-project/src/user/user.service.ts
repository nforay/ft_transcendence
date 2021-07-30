import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity'
import { UserDTO, UserResponseObject } from './user.dto'

@Injectable()
export class UserService {
  constructor(@InjectRepository(UserEntity) private repository: Repository<UserEntity>) {}

  async findAll() : Promise<UserResponseObject[]> {
    const users = await this.repository.find();
    return users.map(user => user.toResponseUser());
  }

  async create(data: UserDTO) : Promise<UserResponseObject> {
    const { name, email } = data;

    let user = await this.repository.findOne({ where: { name } });
    if (user)
      throw new HttpException('User already exists', HttpStatus.CONFLICT);
    user = await this.repository.findOne({ where: { email } });
    if (user)
      throw new HttpException('User already exists', HttpStatus.CONFLICT);


    const newUser = this.repository.create(data);
    await this.repository.save(newUser);
    return newUser.toResponseUser(true);
  }

  async findOne(id: string) : Promise<UserResponseObject> {
    const user = await this.repository.findOne({ where: { id } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    return user.toResponseUser();
  }

  async update(id: string, data: Partial<UserDTO>) : Promise<UserResponseObject> {
    const user = await this.repository.findOne({ where: { id } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    await this.repository.update({ id }, data);
    const newUser = await this.repository.findOne({ where: { id } });
    return newUser.toResponseUser();
  }

  async remove(id: string) : Promise<UserResponseObject> {
    const user = await this.repository.findOne({ where: { id } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    await this.repository.delete({ id });
    return user.toResponseUser();
  }

  async login(data: Partial<UserDTO>) : Promise<UserResponseObject> {
    const { email, password } = data;
    const user = await this.repository.findOne({ where: { email } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (!(await user.checkPassword(password)))
      throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);
    return user.toResponseUser(true);
  }

  async findByName(name: string): Promise<UserResponseObject> {
    const user = await this.repository.findOne({ where: { name } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    return user.toResponseUser();
  }
}
