import { IsNotEmpty } from 'class-validator';

export class ChatMessage {
	@IsNotEmpty()
	name: string;

	@IsNotEmpty()
	msg: string;
}
