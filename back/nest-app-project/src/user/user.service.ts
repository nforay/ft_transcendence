import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import * as pngToJpeg from 'png-to-jpeg';
import * as qrcode from 'qrcode';
import * as speakeasy from 'speakeasy';
import { Repository } from 'typeorm';
import { SecretCodeDTO, UserDTO, UserPassDTO, UserResponseObject } from './user.dto';
import { UserEntity } from './user.entity';
import { TwoFAUser, UserManager, UserStatus } from './user.model';

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
    const friends = await this.repository.find({ where });
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
		console.log('length = ' + length);
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

  async update(authorization: string, data: Partial<UserDTO>) : Promise<UserResponseObject> {
    const { id, isLogged } = await this.isLogged(authorization);
    if (!isLogged)
      throw new HttpException('Invalid Token', HttpStatus.UNAUTHORIZED);
    await this.repository.update({ id }, data);
    const newUser = await this.repository.findOne({ where: { id } });
    return newUser.toResponseUser(true);
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
    if (!name ||!password)
      throw new HttpException('Missing data', HttpStatus.BAD_REQUEST);
    const user = await this.repository.findOne({ where: { name } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
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

  async isLogged(authorization: string) : Promise<any> {
    try {
      const token = authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (UserManager.instance.onlineUsersStatus.has(decoded.id))
        UserManager.instance.onlineUsersStatus.get(decoded.id).lastRequestTime = new Date().getTime();
      else
        UserManager.instance.onlineUsersStatus.set(decoded.id, new UserStatus(decoded.id, 'online', new Date().getTime()));

      return {
        id: decoded.id,
        isLogged: true,
        name: decoded.name
      };
    }
    catch (err) {
      return {
        id: '',
        isLogged: false,
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

    UserManager.instance.remove2FAUserToDisable(user.id);
    this.repository.update({ id: user.id }, { has2FA: false, twoFASecret: '' });
    return { disabled: true }
  }

  async disable2FAPass(data: UserPassDTO) : Promise<any> {
    const user = await this.repository.findOne({ where: { id: data.id } });
    if (!user)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (!(await user.checkPassword(data.password)))
      throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);

    UserManager.instance.disableTwoFAlist.push(new TwoFAUser(user.id));
    return { success: true }
  }
}
