import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import * as pngToJpeg from 'png-to-jpeg';
import * as qrcode from 'qrcode';
import * as speakeasy from 'speakeasy';
import { GameManager } from '../game/game.model';
import { Repository } from 'typeorm';
import { SecretCodeDTO, UserDTO, UserResponseObject, UserUpdateDTO } from './user.dto';
import { UserEntity } from './user.entity';
import { TwoFAUser, UserManager, UserStatus } from './user.model';
import fetch from 'cross-fetch';
import * as https from 'https';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class UserService {
  constructor(@InjectRepository(UserEntity) private repository: Repository<UserEntity>) {
    UserManager.instance.userRepository = this.repository;
  }

  async findAll() : Promise<UserResponseObject[]> {
    const users = await this.repository.find();
    return users.map(user => user.toResponseUser());
  }

	async getFriends(name: string) : Promise<any[]> {
    const user = await this.repository.findOne({ where: { name } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (user.friends.length === 0)
      return [];
    const where = user.friends.map(x => { return { id: x } });
    const friends = await this.repository.find({
      where,
      order: {
        elo: 'DESC'
      }
    });
    if (!friends)
      return [];
    let res = friends.map(x => {
      return {
        ...x.toResponseUser(),
        status: UserManager.instance.onlineUsersStatus.has(x.id) ? UserManager.instance.onlineUsersStatus.get(x.id).status : 'offline'
      }
    });

    return res;
	}

  async getHistory(name: string) : Promise<any[]> {
    const user = await this.repository.findOne({ where: { name } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    let history = await GameManager.instance.gameRepository.find({ where: [
      { player1Id: user.id },
      { player2Id: user.id }
    ]});
    if (!history)
      return [];
    history.sort((a, b) => b.created.getTime() - a.created.getTime());
    let res = await Promise.all(history.map(async (x) => {
      const opponent = await this.repository.findOne({ where: { id: (x.player1Id == user.id ? x.player2Id : x.player1Id)}});
      let opponentName = '';
      if (opponent)
        opponentName = opponent.name;
      
      return {
        ...x.toResponseGame(),
        player1Avatar: `http://${process.env.DOMAIN}:${process.env.PORT}/user/avatar/${x.player1Id}`,
        player2Avatar: `http://${process.env.DOMAIN}:${process.env.PORT}/user/avatar/${x.player2Id}`,
        player1Name: (x.player1Id == user.id ? user.name : opponentName),
        player2Name: (x.player2Id == user.id ? user.name : opponentName),
      }
    }));
    return res;
	}

	async isFriend(id: string, name: string) : Promise<boolean> {
    const user = await this.repository.findOne({ where: { id } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    const friend = await this.findByName(name);
    if (!friend)
      throw new HttpException('Friend not found', HttpStatus.NOT_FOUND);
    return user.isFriend(friend.id);
	}

	async addFriend(id: string, name: string) : Promise<boolean> {
    const user = await this.repository.findOne({ where: { id } });
    if (!user)
		throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		const friend = await this.findByName(name);
		if (!friend)
			throw new HttpException('Friend not found', HttpStatus.NOT_FOUND);
		if (user.id === friend.id)
			throw new HttpException('Cannot add yourself as friend', HttpStatus.NOT_FOUND);
    user.addFriend(friend.id);
    await this.repository.save(user);
		return true;
	}

	async rmFriend(id: string, name: string) : Promise<boolean> {
    const user = await this.repository.findOne({ where: { id } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		const friend = await this.findByName(name);
		if (!friend)
			throw new HttpException('Friend not found', HttpStatus.NOT_FOUND);
    user.rmFriend(friend.id);
    await this.repository.save(user);
		return true;
	}

	async opuser(id: string): Promise<boolean> {
		const user = await this.repository.findOne({ where: { id } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		if (user.role === 'admin') {
			user.role = 'user';
		} else {
			user.role = 'admin';
		}
    await this.repository.save(user);
		return true;
	}

  async create(data: UserDTO) : Promise<UserResponseObject> {
    const { name } = data;

    const user = await this.repository.findOne({ where: { name } });
    if (user)
      throw new HttpException('User already exists', HttpStatus.CONFLICT);

		const length = await this.repository.count();
		if (length === 0) {
			data.role = 'admin';
		} else {
			data.role = 'user';
		}

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

  async update(authorization: string, data: UserUpdateDTO) : Promise<UserResponseObject> {
    const { id, isLogged } = await this.isLogged(authorization);
    if (!isLogged)
      throw new HttpException('Invalid Token', HttpStatus.UNAUTHORIZED);
    let user = await this.repository.findOne({ where: { id } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (data.bio === user.bio)
      throw new HttpException('There was nothing to change', HttpStatus.BAD_REQUEST);
    user.bio = data.bio;
    await this.repository.save(user);
    return user.toResponseUser(true);
  }

  async remove(id: string) : Promise<UserResponseObject> {
    const user = await this.repository.findOne({ where: { id } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		const fs = require('fs');
		fs.unlink('../uploads/avatars/' + user.id + '.jpg', err => {
			Logger.log(err);
		});
    await this.repository.delete({ id });
    return user.toResponseUser();
  }

  async login(data: Partial<UserDTO>) : Promise<UserResponseObject> {
    const { name, password } = data;
    if (!name || !password)
      throw new HttpException('Missing data', HttpStatus.BAD_REQUEST);
    const user = await this.repository.findOne({ where: { name } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (user.fortyTwoId !== -1)
      throw new HttpException('User is a 42 user', HttpStatus.NOT_FOUND);
    if (!(await user.checkPassword(password)))
      throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);
    if (user.has2FA) {
      UserManager.instance.twoFAlist.push(new TwoFAUser(user.id));
      return user.toResponseUser(false, true);
    }
    return user.toResponseUser(true);
  }

  async findByName(name: string): Promise<UserResponseObject> {
    const user = await this.repository.findOne({ where: { name } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    return user.toResponseUser();
  }

  async updateOnlineStatus(user: any) {
    UserManager.instance.onlineUsersStatus.set(user.id, new UserStatus(user.id, 'online', new Date().getTime()));
    return true;
  }

  async isLogged(authorization: string) : Promise<any> {
    try {
      const token = authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      return {
        id: decoded.id,
        isLogged: true,
        role: decoded.role,
        name: decoded.name
      };
    }
    catch (err) {
      return {
        id: '',
        isLogged: false,
        role: 'user',
        name: ''
      };
    }
  }

  async changeAvatar(file: Express.Multer.File) : Promise<UserResponseObject> {
    if (!file)
      throw new HttpException('No file', HttpStatus.BAD_REQUEST);
    const id = path.parse(file.filename).name;
    const user = await this.repository.findOne({ where: { id } })
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (file.filename.toLowerCase().endsWith('.png'))
      await this.convertToJpeg(file);
    else if (file.filename.toLowerCase().endsWith('.jpeg'))
      fs.renameSync(file.path, path.join(file.destination, path.parse(file.filename).name + '.jpg'));
    return user.toResponseUser();
  }

  private async convertToJpeg(file: Express.Multer.File) {
    try {
      let buffer = fs.readFileSync(file.path);
      const output = await pngToJpeg({quality: 90})(buffer);
      fs.writeFileSync(file.destination + '/' + path.parse(file.filename).name + '.jpg', output);
      fs.unlinkSync(file.path);
    }
    catch (err) {
      fs.unlinkSync(file.path);
      throw new HttpException('Unexpected error trying to convert avatar to jpeg', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  public async has2fa(user: Partial<UserResponseObject>) : Promise<any> {
    const id = user.id;
    const db_user = await this.repository.findOne({ where: { id } })
    if (!db_user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    return { enabled: db_user.has2FA };
  }

  public async generateQrCode(user: Partial<UserResponseObject>) : Promise<string> {
    const id = user.id;
    const db_user = await this.repository.findOne({ where: { id } })
    if (!db_user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const secret = speakeasy.generateSecret();
    const url = speakeasy.otpauthURL({
      secret: secret.base32,
      label: db_user.name,
      issuer: 'ft_transcendence'
    })
    const qr_code = qrcode.toDataURL(url);

    UserManager.instance.addSecret(db_user.id, secret.base32)

    return qr_code
  }

  async send2FACode(data: SecretCodeDTO) : Promise<any> {
    const user = await this.repository.findOne({ where: { id: data.userId }})
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    const validSecret = UserManager.instance.validateSecret(user.id, data.code)
    if (!validSecret)
      throw new HttpException('Invalid Code', HttpStatus.UNAUTHORIZED);

    await UserManager.instance.saveSecret(user.id)
    return { valid: true }
  }

  async validate2FA(data: SecretCodeDTO) : Promise<UserResponseObject> {
    const user = await this.repository.findOne({ where: { id: data.userId }})
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND)
    const validSecret = UserManager.instance.validateSecretToLog(user, data.code)
    if (!validSecret)
      throw new HttpException('Code is invalid or expired', HttpStatus.UNAUTHORIZED)

    UserManager.instance.remove2FAUserToLog(user.id);

    return user.toResponseUser(true)
  }

  async disable2FA(data: SecretCodeDTO) : Promise<any> {
    const user = await this.repository.findOne({ where: { id: data.userId }})
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND)
    const validSecret = UserManager.instance.validateSecretToDisable(user, data.code)
    if (!validSecret)
      throw new HttpException('Code is invalid or expired', HttpStatus.UNAUTHORIZED)

    this.repository.update({ id: user.id }, { has2FA: false, twoFASecret: '' });
    return { disabled: true }
  }

  async getLeaderboard(rangeMin: number, rangeMax: number) {
    const leaderboard = await this.repository.find({
      order: {
        elo: 'DESC'
      },
      skip: rangeMin,
      take: rangeMax
    });
    return { players: leaderboard.map(x => x.toResponseUser()) };
  }

  async authenticate (code: string) {

    const encodedForm = 'grant_type=authorization_code'
    + '&client_id=' + process.env.OAUTH2_UID
    + '&client_secret=' + process.env.OAUTH2_SECRET
    + '&code=' + code
    + '&redirect_uri=http://' + process.env.DOMAIN + ':' + process.env.VUE_PORT + '/authenticate'

    const genTokenResponse = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: encodedForm,
    });
    if (!genTokenResponse.ok)
      throw new HttpException('42 API Returned an error code', genTokenResponse.status);
    const genTokenData = (await genTokenResponse.json()) as any;

    const token = genTokenData.access_token;

    const userInfoResponse = await fetch('https://api.intra.42.fr/v2/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!userInfoResponse.ok)
      throw new HttpException('42 API Returned an error code', userInfoResponse.status);
    const userInfoData = (await userInfoResponse.json()) as any;

    let user = await this.repository.findOne({ where: { fortyTwoId: userInfoData.id }});

    if (!user) {
      user = new UserEntity();
      const length = await this.repository.count();
      if (length === 0) {
        user.role = 'admin';
      } else {
        user.role = 'user';
      }
      
      user.fortyTwoId = userInfoData.id;
      let sameName = await this.repository.findOne({ where: { name: userInfoData.login }});
      if (!sameName)
        user.name = userInfoData.login;
      while (sameName) {
        user.name = userInfoData.login + '_' + Math.floor(Math.random() * 100000);
        sameName = await this.repository.findOne({ where: { name: user.name }});
      }
      const password = Math.random().toString(36).slice(-16);
      user.password = password;
      await this.repository.save(user);

      https.get(userInfoData.image_url, (res) => {
        const path = '../uploads/avatars/' + user.id + '.jpg';
        const file = fs.createWriteStream(path);
        res.pipe(file);
        res.on('finish', () => {
          file.close();
        })
      })
    }
    if (user.has2FA) {
      UserManager.instance.twoFAlist.push(new TwoFAUser(user.id));
      return user.toResponseUser(false, true);
    }
    return user.toResponseUser(true);
  }

  @Interval(2000)
  cleanExpired2FA() {
    UserManager.instance.twoFAlist = UserManager.instance.twoFAlist.filter(elem => !elem.expired())
    UserManager.instance.twoFASercrets = UserManager.instance.twoFASercrets.filter(elem => !elem.expired())
    UserManager.instance.disableTwoFAlist = UserManager.instance.disableTwoFAlist.filter(elem => !elem.expired())
  }

  @Interval(5000)
  checkAFKUsers() {
    const now = new Date().getTime();
    // Converting to array and then setting the result to avoid in place deleting
    const users = Array.from(UserManager.instance.onlineUsersStatus.values())
    const usersNotOnline = users.filter(elem => now - elem.lastRequestTime > 1000 * 30)
    usersNotOnline.forEach(elem => UserManager.instance.onlineUsersStatus.delete(elem.userId))
  }

  async block(jwtUser: any, name: string) {
    const sender = await UserManager.instance.userRepository.findOne({ where: { id: jwtUser.id } });
    const toBlock = await UserManager.instance.userRepository.findOne({ where: { name: name } });
    if (!sender || !toBlock)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (sender.id == toBlock.id)
      throw new HttpException('You cannot block yourself', HttpStatus.BAD_REQUEST);

    if (!sender.block(toBlock.id))
      throw new HttpException('User is already blocked', HttpStatus.CONFLICT);

    await UserManager.instance.userRepository.save(sender)
  }

  async unblock(jwtUser: any, name: string) {
    const sender = await UserManager.instance.userRepository.findOne({ where: { id: jwtUser.id } });
    const toBlock = await UserManager.instance.userRepository.findOne({ where: { name: name } });
    if (!sender || !toBlock)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (sender.id == toBlock.id)
    throw new HttpException('You cannot unblock yourself', HttpStatus.BAD_REQUEST);

    if (!sender.unblock(toBlock.id))
      throw new HttpException('User is not blocked', HttpStatus.CONFLICT);

    await UserManager.instance.userRepository.save(sender)
  }

  async isBlocked(jwtUser: any, name: string) {
    const sender = await UserManager.instance.userRepository.findOne({ where: { id: jwtUser.id } });
    const toBlock = await UserManager.instance.userRepository.findOne({ where: { name: name } });
    if (!sender || !toBlock)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (sender.id == toBlock.id)
      return false;

    return { blocked: sender.blocked.indexOf(toBlock.id) !== -1 }
  }
}
