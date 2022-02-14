import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthUser } from '../shared/auth-user.decorator';
import { GameSettingsDto } from './matchmaking.dto';
import { MatchmakingService } from './matchmaking.service';

@Controller('matchmaking')
export class MatchmakingController {

  constructor (private readonly matchMakingService: MatchmakingService) {}

  @Post('join')
  async join(@AuthUser() user, @Body() settings: GameSettingsDto) {
    return await this.matchMakingService.join(user, settings);
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
