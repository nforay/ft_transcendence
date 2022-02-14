import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { MatchmakingController } from './matchmaking.controller';
import { MatchmakingService } from './matchmaking.service';

@Module({
  imports: [ TypeOrmModule.forFeature([UserEntity]) ],
  controllers: [MatchmakingController],
  providers: [MatchmakingService]
})
export class MatchmakingModule {}
