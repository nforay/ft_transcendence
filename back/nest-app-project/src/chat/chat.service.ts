import { ConsoleLogger, Injectable } from '@nestjs/common';
import { ChatMessage } from './chat.dto';
import { Socket } from 'socket.io';
import { ChanService } from './chan.service';
import { readlink } from 'fs';

class clientIdentifier {
	sock: Socket;
	chan: string;
	blocked: string[];
}

@Injectable()
export class ChatService {
	private users: Map<string, clientIdentifier> = new Map<string, clientIdentifier>();

	constructor(private chanService: ChanService) {
	}

	private getUserFromSocket(sock: Socket): string {
		for (let [key, value] of this.users) {
			if (value.sock == sock)
				return key;
		}
		return null;
	}

	async execute(msg: ChatMessage, client: Socket) {
		let uname = this.getUserFromSocket(client);
		if (uname == null)
			return;
		const Arr = msg.msg.split(" ");

		switch (Arr[0]) {
			//! Rajouter:
			//! /challenge <user>
			//TODO /y (<user>) accepter le dernier challenge ou le challenge d'un utilisateur
			//! Bugs:
			//! Quitter et rejoindre un channel fait perdre le status de ban ou mute
			//! Si le owner join un autre chan son chan n'est pas supprimé
			case "/ping":
				msg.name = "";
				msg.msg = "pong";
				client.emit('recv_message', msg);
				return;

			case "/help":
				msg.name = "";
				msg.msg = "/help Print this help";
				client.emit('recv_message', msg);
				msg.msg = "/chans List public channels";
				client.emit('recv_message', msg);
				msg.msg = "/users List users on this channel";
				client.emit('recv_message', msg);
				msg.msg = "/join <channel> (<password>) Join a channel";
				client.emit('recv_message', msg);
				msg.msg = "/leave Shortcut for \"/join general\"";
				client.emit('recv_message', msg);
				msg.msg = "/pm <user> Send a private message to some user";
				client.emit('recv_message', msg);
				msg.msg = "/block <user> Block messages from some user";
				client.emit('recv_message', msg);
				msg.msg = "/challenge <user> Challenge user to a pong game";
				client.emit('recv_message', msg);
				msg.msg = "/y (<user>) Accept the last challenge or a challenge from a specific user";
				client.emit('recv_message', msg);
				msg.msg = "/cchan <name> (<public/private>) Create a new channel";
				client.emit('recv_message', msg);
				msg.msg = "/dchan <name> Delete a channel";
				client.emit('recv_message', msg);
				msg.msg = "/op <user> Make a user a channel operator, if the user is already an operator it removes his priviledges";
				client.emit('recv_message', msg);
				msg.msg = "/kick <user> Kick a user back to the general channel without banning him";
				client.emit('recv_message', msg);
				msg.msg = "/ban <user> Ban user";
				client.emit('recv_message', msg);
				msg.msg = "/unban <user> Unban user";
				client.emit('recv_message', msg);
				msg.msg = "/mute <user> <seconds> Mute user for x seconds";
				client.emit('recv_message', msg);
				msg.msg = "/unmute <user> Unmute user";
				client.emit('recv_message', msg);
				return;

			default:
				let c = this.users.get(uname).chan;
				let banstate = await this.chanService.checkban(c, uname);
				switch (banstate) {
					case "-1":
						console.log("User is banned");
						msg.name == "";
						msg.msg == "You are banned";
						client.emit('recv_message', msg);
						return;

					case "0":
						console.log("Sending message from user " + uname + " to channel " + c);
						let cusers = await this.chanService.getUsers(c);
						for (let index = 0; index < cusers.length; index++) {
							if (this.users.get(cusers[index]).blocked.indexOf(uname) == -1)
								this.users.get(cusers[index]).sock.emit('recv_message', msg);
						}
						return;

					default:
						console.log("User is muted");
						msg.name = "";
						msg.msg = "You are muted for " + banstate + " seconds";
						client.emit('recv_message', msg);
						return;
				}
		}
	}

	async addClient(uname: string, client: Socket) {
		this.users.set(uname, {
			sock: client,
			chan: "general",
			blocked: []
		});
		await this.chanService.join("general", uname);
		console.log("Added client " + uname);
	}

	async rmClient(client: Socket) {
		let uname = this.getUserFromSocket(client);
		if (uname != null) {
			await this.chanService.leave(this.users.get(uname).chan, uname);
			this.users.delete(uname);
		}
		console.log("Removed client " + uname);
	}
}
