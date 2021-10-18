import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BeforeInsert, OneToOne } from 'typeorm';
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { UserResponseObject } from './user.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @CreateDateColumn() created: Date;

  @Column({ type: 'text', unique: true }) name: string;
  @Column({ type: 'text', default: 'user' }) role: string;
  @Column({ type: 'text', default: '' }) bio: string;
  @Column({ type: 'boolean', default: false}) banned: boolean;
  @Column('text') password: string;
  @Column({ type: 'boolean', default: false}) has2FA: boolean;
  @Column({ type: 'text', default: ''}) twoFASecret: string;

  @BeforeInsert()
  private async hashPassword() {
    if (!this.password)
      throw new HttpException('Password is required', HttpStatus.BAD_REQUEST);
    this.password = await bcrypt.hash(this.password, 10);
  }

  toResponseUser(withToken: boolean = false, with2FA: boolean = false) : UserResponseObject {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      bio: this.bio,
      avatar: `http://localhost:4000/user/avatar/${this.id}`,
      token: (withToken) ? this.token : undefined,
      has2FA: (with2FA) ? this.has2FA : undefined,
      expiresIn: (withToken) ? this.expiresIn : undefined
    };
  }

  async checkPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  private get token() {
    return (jwt.sign({id: this.id, name: this.name, role: this.role }, process.env.JWT_SECRET, {expiresIn: '1h'}));
  }

  private get expiresIn() {
    return 60 * 60 * 1000;
  }
}
