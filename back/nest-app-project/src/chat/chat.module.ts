import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChanEntity } from './chan.entity';
import { ChanService } from './chan.service';

@Module({
	imports: [TypeOrmModule.forFeature([ChanEntity])],
	controllers: [],
	providers: [ChatGateway, ChatService, ChanService],
})
export class ChatModule { }
