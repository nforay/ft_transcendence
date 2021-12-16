import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Module } from '@nestjs/common';
import { ChanService } from './chan.service';
import { ChatCommandHandlers } from './chat.commands';
import { ChanEntity } from './chan.entity';

@Module({
	imports: [],
	controllers: [],
	providers: [ChatGateway, ChatService, ChanService, ChatCommandHandlers, ChanEntity],
})
export class ChatModule { }
