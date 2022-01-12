import { Get, Post, Put, Delete, Param, Controller, Headers, Logger, Query, UploadedFile, HttpStatus, HttpException, Res, Header } from '@nestjs/common';
import { ChanManager, ChanService } from './chan.service';
import * as jwt from 'jsonwebtoken'
import { UserManager } from 'src/user/user.model';

@Controller('chan')
export class ChanController {

	constructor(private readonly chanService: ChanService) { }

	async checkAdminRights(token: string): Promise<boolean> {
		try {
      const decoded = await jwt.verify(token, process.env.JWT_SECRET);
      const user = await UserManager.instance.userRepository.findOne({ id: decoded.id });
      if (!user) {
        return false;
      }
    } catch (err) {
      return false;
    }
		return true;
	}

	@Get(':token')
	async findAll(@Param('token') token) {
		if (await this.checkAdminRights(token) === false) {
			throw new HttpException('User is not administrator', HttpStatus.FORBIDDEN);
		}
		return { chans: this.chanService.findAll() };
	}

	@Delete(':token')
	async dchan(@Param('token') token) {
		if (await this.checkAdminRights(token) === false) {
			throw new HttpException('User is not administrator', HttpStatus.FORBIDDEN);
		}
		return this.chanService.dchan();
	}
}
