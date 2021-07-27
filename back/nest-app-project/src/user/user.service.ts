import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity'
import { UserDTO } from './user.dto'

@Injectable()
export class UserService {
  constructor(@InjectRepository(UserEntity) private repository: Repository<UserEntity>) {}

  async findAll() {
    return await this.repository.find();
  }

  async create(data: UserDTO) {
    const user = this.repository.create(data);
    await this.repository.save(user);
    return user;
  }

  async findOne(id: string) {
    return await this.repository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<UserDTO>) {
    await this.repository.update({ id }, data);
    return await this.repository.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.repository.delete({ id });
    return { deleted: true };
  }
}
