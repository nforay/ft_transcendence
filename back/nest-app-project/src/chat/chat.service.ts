import { ConsoleLogger, Injectable } from '@nestjs/common';
import { ChatMessage } from './chat.dto';
import { Socket } from 'socket.io';
import { ChanService } from './chan.service';
import { readlink } from 'fs';
import { resolve } from 'path/posix';

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

	async init() {
		await this.chanService.promIni;
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
				if (Arr.length != 1) {
					msg.msg = "Wrong number of arguments";
					client.emit('recv_message', msg);
					return;
				}
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
				msg.msg = "/pm <user> <message> Send a private message to some user";
				client.emit('recv_message', msg);
				msg.msg = "/block <user> Block messages from some user or list blocked user if no argument is provided";
				client.emit('recv_message', msg);
				msg.msg = "/unblock <user> Unblock messages from some user";
				client.emit('recv_message', msg);
				// msg.msg = "/challenge <user> Challenge user to a pong game";
				// client.emit('recv_message', msg);
				// msg.msg = "/y (<user>) Accept the last challenge or a challenge from a specific user";
				// client.emit('recv_message', msg);
				msg.msg = "/cchan <name> (<public/private>) Create a new channel";
				client.emit('recv_message', msg);
				msg.msg = "/dchan <name> Delete a channel";
				client.emit('recv_message', msg);
				msg.msg = "/op <user> Make a user a channel operator, if the user is already an operator it removes his priviledges if no argument is provided list channel operators";
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

			case "/chans":
				msg.name = "";
				if (Arr.length != 1) {
					msg.msg = "Wrong number of arguments";
				}
				else {
					await this.chanService.getPublicChannels().then((resolve) => {
						for (let index = 0; index < resolve.length; index++) {
							msg.msg = resolve[index];
							client.emit('recv_message', msg);
						}
					}).catch((reject) => {
						console.log("/chans CATCH BLOCK, REJECT MESSAGE: " + reject[0]);
						client.emit('recv_message', msg);
					});
				}
				return;

			case "/users":
				msg.name = "";
				if (Arr.length != 1) {
					msg.msg = "Wrong number of arguments";
				}
				else {
					await this.chanService.getUsers(this.users.get(uname).chan).then((resolve) => {
						msg.msg = resolve.toString();
					}).catch((reject) => {
						msg.msg = reject[0];
					});
				}
				client.emit('recv_message', msg);
				return;

			case "/op":
				msg.name = "";
				if (Arr.length == 1) {
					await this.chanService.op(this.users.get(uname).chan, uname).then((resolve) => {
						msg.msg = resolve;
					}).catch((reject) => {
						msg.msg = reject;
					});
				}
				else if (Arr.length == 2) {
					await this.chanService.op(this.users.get(uname).chan, uname);
				}
				else {
					msg.msg = "Wrong number of arguments";
				}
				client.emit('recv_message', msg);
				return;

			case "/block":
				msg.name = "";
				if (Arr.length > 2) {
					msg.msg = "Wrong number of arguments";
				}
				else if (Arr.length == 1) {
					msg.msg = this.users.get(uname).blocked.toString();
				}
				else {
					this.users.get(uname).blocked.push(Arr[1]);
					msg.msg = "User " + Arr[1] + " has been blocked";
				}
				client.emit('recv_message', msg);
				return;

			case "/unblock":
				msg.name = "";
				if (Arr.length != 2) {
					msg.msg = "Wrong number of arguments";
				}
				else {
					let b = this.users.get(uname).blocked.indexOf(Arr[1]);
					if (b == -1) {
						msg.msg = "User " + Arr[1] + " isn't blocked";
					}
					else {
						this.users.get(uname).blocked.splice(b, 1);
						msg.msg = "User " + Arr[1] + " is unblocked";
					}
				}
				client.emit('recv_message', msg);
				return;

			case "/pm":
				if (Arr.length < 3) {
					msg.name = "";
					msg.msg = "Wrong number of arguments";
					return;
				}
				if (this.users.has(Arr[1]) == false) {
					msg.name = "";
					msg.msg = "User " + Arr[1] + " doesn't exist or isn't connected";
					return;
				}
				if (this.users.get(Arr[1]).blocked.indexOf(uname) != -1) {
					msg.name = "";
					msg.msg = "You are blocked";
				}
				else {
					msg.msg = "pm: ";
					for (let index = 2; index < Arr.length; index++) {
						msg.msg += Arr[index] + " ";
					}
					msg.msg = msg.msg.trimEnd();
					this.users.get(Arr[1]).sock.emit('recv_message', msg);
				}
				client.emit('recv_message', msg);
				return;

			case "/cchan":
				msg.name = "";
				if (Arr.length < 2 || Arr.length > 3) {
					msg.msg = "Wrong number of arguments";
				}
				else if (Arr.length == 3 && Arr[2] != "private" && Arr[2] != "public") {
					msg.msg = "Second argument must be either \'private\' or \'public\'";
				}
				else {
					await this.chanService.cchan(Arr[1], uname).then(async (resolve) => {
						msg.msg = resolve;
						if (Arr.length == 3 && Arr[2] == "public")
							await this.chanService.setpublic(Arr[1], uname);
					}).catch((reject) => {
						msg.msg = reject;
					});
				}
				client.emit('recv_message', msg);
				return;

			case "/dchan":
				msg.name = "";
				if (Arr.length != 2) {
					msg.msg = "Wrong number of arguments";
					client.emit('recv_message', msg);
					return;
				}
				else {
					await this.chanService.getUsers(Arr[1]).then(async (cusers) => {
						await this.chanService.dchan(Arr[1], uname).then((resolve) => {
							console.log("TEST SI CUSERS EST TOUJOURS ACCESSIBLE = " + cusers);
							msg.msg = resolve;
							for (let index = 0; index < cusers.length; index++) {
								if (this.users.has(cusers[index]) && this.users.get(cusers[index]).blocked.indexOf(uname) == -1) {
									this.users.get(cusers[index]).chan = "general";
									if (cusers[index] != uname)
										this.users.get(cusers[index]).sock.emit('recv_message', msg);
								}
							}
						});
					}).catch((reject) => {
						msg.msg = reject;
					});
				}
				client.emit('recv_message', msg);
				return;

			case "/join":
				msg.name = "";
				if (Arr.length < 2 || Arr.length > 3) {
					msg.msg = "Wrong number of arguments";
				}
				else if (Arr.length == 2) {
					await this.chanService.join(Arr[1], uname).then(async (resolve) => {
						msg.msg = resolve;
						await this.chanService.leave(this.users.get(uname).chan, uname);
						this.users.get(uname).chan = Arr[1];
					}).catch((reject) => {
						msg.msg = reject;
					});
				}
				else if (Arr.length == 3) {
					await this.chanService.join(Arr[1], uname, Arr[2]).then(async (resolve) => {
						msg.msg = resolve;
						await this.chanService.leave(this.users.get(uname).chan, uname);
						this.users.get(uname).chan = Arr[1];
					}).catch((reject) => {
						msg.msg = reject;
					});
				}
				client.emit('recv_message', msg);
				return;

			case "/kick":
				msg.name = "";
				if (Arr.length != 2) {
					msg.msg = "Wrong number of arguments";
				}
				else {
					await this.chanService.checkadmin(this.users.get(uname).chan, uname).then(async (resolve) => {
						if (resolve == true) {
							if (this.users.has(Arr[1]) == false) {
								msg.msg = "can't find user " + Arr[1];
							}
							else {
								await this.chanService.leave(this.users.get(Arr[1]).chan, Arr[1]);
								await this.chanService.join("general", Arr[1]);
								this.users.get(Arr[1]).chan = "general";
								msg.msg = "You've been kicked";
								this.users.get(Arr[1]).sock.emit('recv_message', msg);
								msg.msg = "kicked user " + Arr[1];
							}
						}
						else {
							msg.msg = "You are not operator of this channel";
						}
					}).catch(() => {
						msg.msg = "Can't find channel"
					});
				}
				client.emit('recv_message', msg);
				return;

			case "/ban":
				msg.name = "";
				if (Arr.length != 2) {
					msg.msg = "Wrong number of argmuents";
				}
				else {
					await this.chanService.checkadmin(this.users.get(uname).chan, uname).then(async (resolve) => {
						if (resolve == false) {
							msg.msg = "You are not operator of this channel";
						}
						else {
							await this.chanService.ban(this.users.get(uname).chan, Arr[1]).then((resolveban) => {
								msg.msg = resolveban;
							});
						}
					}).catch(() => {
						msg.msg = "Can't find channel";
					});
				}
				client.emit('recv_message', msg);
				return;

			case "/mute":
				msg.name = "";
				if (Arr.length != 3) {
					msg.msg = "Wrong number of argmuents";
				}
				else {
					await this.chanService.checkadmin(this.users.get(uname).chan, uname).then(async (resolve) => {
						if (resolve == false) {
							msg.msg = "You are not operator of this channel";
						}
						else {
							let dur = parseInt(Arr[2], 10);
							console.log("Banning user " + Arr[1] + " for " + dur + " seconds");
							if (dur != NaN && dur > 0)
								await this.chanService.ban(this.users.get(uname).chan, Arr[1], dur).then((resolveban) => {
									msg.msg = resolveban;
								});
							else
								msg.msg = "Wrong duration";
						}
					}).catch(() => {
						msg.msg = "Can't find channel";
					});
				}
				client.emit('recv_message', msg);
				return;

			case "/unban":
			case "/unmute":
				msg.name = "";
				if (Arr.length != 2) {
					msg.msg = "Wrong number of arguments";
				}
				else {
					await this.chanService.unban(this.users.get(uname).chan, Arr[1]).then((resolve) => {
						msg.msg = resolve;
					}).catch((reject) => {
						msg.msg = reject;
					});
				}
				client.emit('recv_message', msg);
				return;

			case "/leave":
				msg.name = "";
				if (Arr.length != 1) {
					msg.msg = "Wrong number of arguments";
				}
				else {
					await this.chanService.join("general", uname).then(async (resolve) => {
						msg.msg = resolve;
						await this.chanService.leave(this.users.get(uname).chan, uname);
						this.users.get(uname).chan = "general";
					}).catch((reject) => {
						msg.msg = reject;
					});
				}
				client.emit('recv_message', msg);
				return;

			default:
				let c = this.users.get(uname).chan;
				let banstate = await this.chanService.checkban(c, uname);
				switch (banstate) {
					case "-1":
						console.log("User is banned pd");
						msg.name = "";
						msg.msg = "You are banned";
						client.emit('recv_message', msg);
						return;

					case "0":
						let cusers: string[];
						await this.chanService.getUsers(c).then((resolve) => {
							cusers = resolve;
							console.log("Sending message from user " + uname + " to channel " + c);
						}).catch(() => {
							console.log("AAAAAAAAAAAAAAAAAAAAA");
						});
						console.log(cusers);
						for (let index = 0; index < cusers.length; index++) {
							if (this.users.has(cusers[index]) && this.users.get(cusers[index]).blocked.indexOf(uname) == -1)
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
		await this.chanService.join("general", uname).then((resolve) => {
			console.log(resolve);
		}).catch((reason) => {
			console.log(reason);
		});
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
