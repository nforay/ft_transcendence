import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Module } from '@nestjs/common';

@Module({
	imports: [],
	controllers: [],
	providers: [ChatGateway, ChatService],
})
export class ChatModule { }
