import { IsNotEmpty } from 'class-validator';
import { GameSettingsDto } from '../matchmaking/matchmaking.dto';

export class ChatMessage {
	@IsNotEmpty()
	token: string;

	@IsNotEmpty()
	msg: string;

  isCommandResponse: boolean = false;
}

export class RequestMessage extends GameSettingsDto {
	@IsNotEmpty()
	token: string;

	@IsNotEmpty()
	to: string;
}

export class DeclineMessage extends GameSettingsDto {
	@IsNotEmpty()
	token: string;

	@IsNotEmpty()
	sender: string;
}

export class AcceptMessage extends DeclineMessage {
}
