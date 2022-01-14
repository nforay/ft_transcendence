import { Get, Post, Put, Delete, Param, Controller, Headers, Logger, Query, UploadedFile, HttpStatus, HttpException, Res, Header } from '@nestjs/common';
import { ChanManager, ChanService } from './chan.service';
import { ChatUsersManager } from './chat.service';
import * as jwt from 'jsonwebtoken'
import { UserManager } from 'src/user/user.model';
import { userInfo } from 'os';
import { UserEntity } from 'src/user/user.entity';

@Controller('chan')
export class ChanController {

	constructor(private readonly chanService: ChanService) { }

	async checkAdminRights(token: string): Promise<string> {
		let user: UserEntity;
		try {
      const decoded = await jwt.verify(token, process.env.JWT_SECRET);
      user = await UserManager.instance.userRepository.findOne({ id: decoded.id });
      if (!user) {
        return null;
      }
    } catch (err) {
      return null;
    }
		return user.name;
	}

	@Get(':token')
	async findAll(@Param('token') token: string) {
		if (await this.checkAdminRights(token) === null) {
			throw new HttpException('User is not administrator', HttpStatus.FORBIDDEN);
		}
		return { chans: this.chanService.findAll() };
	}

	@Delete('test/:token/:cname')
	async dchan(@Param('token') token: string, @Param('cname') cname: string) {
		const uname = await this.checkAdminRights(token);
		if (uname === null) {
			throw new HttpException('User is not administrator', HttpStatus.FORBIDDEN);
		}
		const ret = await this.chanService.dchan(ChatUsersManager.users, cname, uname);
		return { msg: ret };
	}
}
