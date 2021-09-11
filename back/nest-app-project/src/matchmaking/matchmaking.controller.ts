import { Controller, Get, Post } from '@nestjs/common';
import { AuthUser } from 'src/shared/auth-user.decorator';
import { MatchmakingService } from './matchmaking.service';

@Controller('matchmaking')
export class MatchmakingController {

  constructor (private readonly matchMakingService: MatchmakingService) {}

  @Post('join')
  async join(@AuthUser() user) {
    return await this.matchMakingService.join(user);
  }

  @Get('poll')
  async poll(@AuthUser() user) {
    return await this.matchMakingService.poll(user);
  }

  @Post('leave')
  async leave(@AuthUser() user) {
    return await this.matchMakingService.leave(user);
  }
}
