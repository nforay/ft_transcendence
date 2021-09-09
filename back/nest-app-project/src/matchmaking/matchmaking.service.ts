import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken'

@Injectable()
export class MatchmakingService {

  constructor(@InjectRepository(UserEntity) private userRepository: Repository<UserEntity>, 
    private queue: Array<string>) {}

  async join(authorization: string) {
    const decoded = await jwt.verify(authorization.split(' ')[1], process.env.JWT_SECRET);
    const user = await this.userRepository.findOne({ where: { id: decoded.id } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (this.queue.includes(user.id) || user.banned) {
      return { accepted: false };
    }
    this.queue.push(user.id);
    return { accepted: true };
  }

  async poll(authorization: string) {
    const decoded = await jwt.verify(authorization.split(' ')[1], process.env.JWT_SECRET);
    const user = await this.userRepository.findOne({ where: { id: decoded.id } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (!this.queue.includes(user.id)) {
      throw new HttpException('User not in queue', HttpStatus.BAD_REQUEST);
    }
    if (this.queue.length >= 2) {
      const opponent = this.queue.shift();
      return { found: true, opponent };
    }
    return { found: false };
  }

  async leave(authorization: string) {
    const decoded = await jwt.verify(authorization.split(' ')[1], process.env.JWT_SECRET);
    const user = await this.userRepository.findOne({ where: { id: decoded.id } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (!this.queue.includes(user.id)) {
      throw new HttpException('User not in queue', HttpStatus.BAD_REQUEST);
    }
    this.queue.splice(this.queue.indexOf(user.id), 1);
    return { left: true };
  }
}
