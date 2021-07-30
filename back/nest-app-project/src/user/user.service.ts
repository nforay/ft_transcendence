import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity'
import { UserDTO } from './user.dto'

@Injectable()
export class UserService {
  constructor(@InjectRepository(UserEntity) private repository: Repository<UserEntity>) {}

  async findAll() {
    const users = await this.repository.find();
    return users.map(user => user.toResponseUser());
  }

  async create(data: UserDTO) {
    const user = this.repository.create(data);
    await this.repository.save(user);
    return user.toResponseUser();
  }

  async findOne(id: string) {
    const user = await this.repository.findOne({ where: { id } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    return user.toResponseUser();
  }

  async update(id: string, data: Partial<UserDTO>) {
    const user = await this.repository.findOne({ where: { id } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    await this.repository.update({ id }, data);
    const newUser = await this.repository.findOne({ where: { id } });
    return newUser.toResponseUser();
  }

  async remove(id: string) {
    const user = await this.repository.findOne({ where: { id } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    await this.repository.delete({ id });
    return user.toResponseUser();
  }
}
