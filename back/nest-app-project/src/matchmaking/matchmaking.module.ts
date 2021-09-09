import { Module } from '@nestjs/common';
import { MatchmakingController } from './matchmaking.controller';
import { MatchmakingService } from './matchmaking.service';

@Module({
  controllers: [MatchmakingController],
  providers: [MatchmakingService]
})
export class MatchmakingModule {}
