import { IsNotEmpty } from 'class-validator';

export class ChatMessage {
	@IsNotEmpty()
	token: string;

	@IsNotEmpty()
	msg: string;

  isCommandResponse: boolean = false;
}

export class RequestMessage {
	@IsNotEmpty()
	token: string;

	@IsNotEmpty()
	to: string;
}
