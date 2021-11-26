import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChanEntity } from './chan.entity';

@Module({
	imports: [TypeOrmModule.forFeature([ChanEntity])],
	controllers: [],
	providers: [ChatGateway, ChatService],
})
export class ChatModule { }
