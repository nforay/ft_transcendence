import { Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/shared/auth.guard';
import { MatchmakingService } from './matchmaking.service';

@Controller('matchmaking')
export class MatchmakingController {

  constructor (private readonly matchMakingService: MatchmakingService) {}

  @Post('join')
  @UseGuards(AuthGuard)
  async join(@Headers() headers) {
    return await this.matchMakingService.join(headers.authorization);
  }

  @Get('poll')
  @UseGuards(AuthGuard)
  async poll(@Headers() headers) {
    return await this.matchMakingService.poll(headers.authorization);
  }

  @Post('leave')
  @UseGuards(AuthGuard)
  async leave(@Headers() headers) {
    return await this.matchMakingService.leave(headers.authorization);
  }
}
