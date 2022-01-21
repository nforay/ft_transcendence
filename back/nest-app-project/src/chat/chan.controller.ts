import { Get, Delete, Param, Controller, HttpException, HttpStatus } from '@nestjs/common';
import { ChanService } from './chan.service';
import { ChatUsersManager } from './chat.service';
import { AuthUser } from '../shared/auth-user.decorator';
import { ChatCommandHandlers } from './chat.commands';

@Controller('chan')
export class ChanController {

	constructor(private readonly chanService: ChanService, private readonly chatCommandHandlers: ChatCommandHandlers) { }

	@Get()
	async findAll(@AuthUser() user) {
		if (user.role !== 'admin') {
			throw new HttpException('User is not admin', HttpStatus.FORBIDDEN);
		}
		return { chans: this.chanService.findAll() };
	}

	@Delete(':cname')
	async dchan(@Param('cname') cname: string, @AuthUser() user) {
		if (user.role !== 'admin') {
			throw new HttpException('User is not admin', HttpStatus.FORBIDDEN);
		}
		const ret = await this.chatCommandHandlers.dchanCommand(null, ['', cname], user.name, ChatUsersManager.users, this.chanService);
		return { msg: ret };
	}
}
