import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Module } from '@nestjs/common';
import { ChanManager, ChanService } from './chan.service';
import { ChatCommandHandlers } from './chat.commands';
import { ChanEntity } from './chan.entity';
import { ChanController } from './chan.controller';

@Module({
	imports: [],
	controllers: [ChanController],
	providers: [ChatGateway, ChatService, ChanService, ChatCommandHandlers, ChanEntity, ChanManager],
})
export class ChatModule { }
