import { Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/shared/auth.guard';
import { MatchmakingService } from './matchmaking.service';

export class JoinResponseDto {
  accepted: boolean; // False if user is already in a game or banned for example
}

@Controller('matchmaking')
export class MatchmakingController {

  constructor (private readonly matchMakingService: MatchmakingService) {}

  @Post('join')
  @UseGuards(AuthGuard)
  async join(@Headers() headers) : Promise<JoinResponseDto> {
    return await this.matchMakingService.join(headers.authorization);
  }

  @Get('poll')
  @UseGuards(AuthGuard)
  poll(@Headers() headers) {
    return this.matchMakingService.poll(headers.authorization);
  }

  @Post('leave')
  @UseGuards(AuthGuard)
  leave(@Headers() headers) {
    return this.matchMakingService.leave(headers.authorization);
  }
}
