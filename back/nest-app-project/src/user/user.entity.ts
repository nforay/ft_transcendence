import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BeforeInsert, OneToOne } from 'typeorm';
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { UserResponseObject } from './user.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { BanData } from '../chat/chan.entity';
import { UserManager } from './user.model';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @CreateDateColumn() created: Date;

  @Column({ type: 'int', default: -1 }) fortyTwoId: number;

  @Column({ type: 'text', unique: true }) name: string;
  @Column({ type: 'text', default: 'user' }) role: string;
  @Column({ type: 'text', default: '' }) bio: string;
  @Column({ type: 'boolean', default: false}) banned: boolean;
  @Column('text') password: string;
  @Column({ type: 'boolean', default: false}) has2FA: boolean;
  @Column({ type: 'text', default: ''}) twoFASecret: string;
  @Column({ type: 'uuid', array: true, default: [] }) blocked: string[];
  @Column({ type: 'uuid', array: true, default: [] }) friends: string[];
  @Column({ type: 'int', default: 1200 }) elo: number;
  @Column({ type: 'int', default: 0 }) win: number;
  @Column({ type: 'int', default: 0 }) lose: number;
  @Column({ type: 'int', default: 0 }) xp: number;
  @Column({ type: 'boolean', default: false }) spectateAchievement: boolean;

  @Column({ type: 'text', array: true, default: [] }) chatBan: string[];
  @Column({ type: 'text', array: true, default: [] }) chatMute: string[];
  @Column({ type: 'text', default: 'general' }) chatLastChannel: string;


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
      elo: this.elo,
      win: this.win,
      lose: this.lose,
      level: this.getLevel(),
      avatar: `${process.env.URL}:${process.env.NEST_PORT}/user/avatar/${this.id}`,
      status: UserManager.instance.onlineUsersStatus.has(this.id) ? UserManager.instance.onlineUsersStatus.get(this.id).status : 'offline',
      achievements: this.computeAchievements(),
      rank: this.getRankName(),
      token: (withToken) ? this.token : undefined,
      has2FA: (with2FA) ? this.has2FA : undefined,
      expiresIn: (withToken) ? this.expiresIn : undefined
    };
  }

  getRankName() {
    if (this.elo > 1600)
      return 'Master';
    if (this.elo > 1500)
      return 'Gold 3'
    if (this.elo > 1400)
      return 'Gold 2';
    if (this.elo > 1300)
      return 'Gold 1';
    if (this.elo > 1200)
      return 'Silver 3';
    if (this.elo > 1100)
      return 'Silver 2';
    return 'Silver 1';
  }

  computeAchievements() {
    const playCount = this.win + this.lose;
    let ret = []
    if (playCount > 5)
      ret.push('playcount_1');
    if (playCount > 10)
      ret.push('playcount_2');
    if (this.fortyTwoId !== -1)
      ret.push('42');
    if (this.spectateAchievement)
      ret.push('spectate');
    return ret;
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

  addFriend(id: string) {
    if (this.friends.indexOf(id) !== -1)
      return false;
    this.friends.push(id);
    return true;
  }

  rmFriend(id: string) {
    if (this.friends.indexOf(id) === -1)
      return false;
    this.friends.splice(this.friends.indexOf(id), 1);
    return true;
  }

  getLevel() {
    let level = 0;
    let xp = this.xp;
    while (xp >= ((level / 3) * 65)) {
      level++;
      xp -= ((level / 3) * 65);
    }
    return level + (xp / ((level / 3) * 65));
  }

  isFriend(id: string) {
    return this.friends.indexOf(id) !== -1
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
