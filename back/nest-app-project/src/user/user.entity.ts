import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BeforeInsert, OneToOne } from 'typeorm';
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { UserResponseObject } from './user.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { BanData } from 'src/chat/chan.entity';

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
  @Column({ type: 'uuid', array: true, default: [] }) blocked: string[];
  @Column({ type: 'uuid', array: true, default: [] }) friends: string[];

  @Column({ type: 'text', array: true, default: [] }) chatBan: string[];
  @Column({ type: 'text', array: true, default: [] }) chatMute: string[];


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

  block(uuid: string) {
    if (this.blocked.indexOf(uuid) !== -1)
      return false;
    this.blocked.push(uuid);
    return true;
  }

  unblock(uuid: string) {
    if (this.blocked.indexOf(uuid) === -1)
      return false;
    this.blocked.splice(this.blocked.indexOf(uuid), 1);
    return true;
  }

  isBlocking(uuid: string) {
    return this.blocked.indexOf(uuid) !== -1
  }

  addFriend(uuid: string) {
    if (this.friends.indexOf(uuid) !== -1)
      return false;
    this.friends.push(uuid);
    return true;
  }

  rmFriend(uuid: string) {
    if (this.friends.indexOf(uuid) === -1)
      return false;
    this.friends.splice(this.friends.indexOf(uuid), 1);
    return true;
  }

  isFriend(uuid: string) {
    return this.friends.indexOf(uuid) !== -1
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

  checkban(): BanData {
		return this.chatBan.length > 0 ? new BanData("").fromArray(this.chatBan) : null;
	}

  checkmute(): BanData {
		return this.chatMute.length > 0 ? new BanData("").fromArray(this.chatMute) : null;
	}

	banUser(reason?: string, duration?: number) : BanData {
    const banData = new BanData(this.id, reason, duration);
    this.chatBan = banData.toArray();
    return banData;
	}

	unbanUser() {
    this.chatBan = [];
	}

  muteUser(reason?: string, duration?: number) : BanData {
    const banData = new BanData(this.id, reason, duration);
    this.chatMute = banData.toArray();
    return banData;
	}

	unmuteUser() {
    this.chatMute = [];
	}
}
