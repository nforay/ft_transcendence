import { Get, Delete, Param, Controller, UseGuards } from '@nestjs/common';
import { ChanService } from './chan.service';
import { ChatUsersManager } from './chat.service';
import { AdminGuard } from '../shared/admin.guard';

@Controller('chan')
export class ChanController {

	constructor(private readonly chanService: ChanService) { }

	@Get()
  @UseGuards(AdminGuard)
	async findAll() {
		return { chans: this.chanService.findAll() };
	}

	@Delete(':uname/:cname')
  @UseGuards(AdminGuard)
	async dchan(@Param('uname') uname: string, @Param('cname') cname: string) {
		const ret = await this.chanService.dchan(ChatUsersManager.users, cname, uname);
		return { msg: ret };
	}
}
