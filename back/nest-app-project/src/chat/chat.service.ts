import { Injectable } from '@nestjs/common';
import { ChatMessage } from './chat.dto';
import { Socket } from 'socket.io';
import { ChanService } from './chan.service';

class chatChannel {
	name: string;
	owner: Socket;
	admins: Socket[];
	users: Map<Socket, [number, number]>;
	// Socket is the user, number is the ban
	// status, 0 is not banned, -1 is banned
	// and any other number is the timestamp
	// of the mute, the second number is the
	// duration
	type: string;
	passwd: string;
}

class clientIdentifier {
	name: string;
	chan: string;
	blocked: Socket[];
}

@Injectable()
export class ChatService {
	private clients: Map<Socket, clientIdentifier> = new Map<Socket, clientIdentifier>();

	private chans: chatChannel[] = [{
		"name": "general",
		"owner": null,
		"admins": [],
		"users": new Map<Socket, [number, number]>(),
		"type": "public",
		"passwd": null
	}];

	private getChan(chan: string): number {
		for (let index = 0; index < this.chans.length; index++) {
			if (this.chans[index].name == chan)
				return index;
		}
		return null;
	}

	private addToChan(chan: string, client: Socket) {
		let c = this.getChan(chan);
		if (c != null)
			this.chans[c].users.set(client, [0, 0]);
	}

	private clearChan(chan: string, client: Socket): boolean {
		let c = this.getChan(chan);
		if (c == null || this.chans[c].owner != client)
			return false;
		this.chans[c].users.forEach((value, key) => {
			this.clients.get(key).chan = "general";
			this.addToChan("general", client);
			key.emit('recv_message', {
				"name": "",
				"msg": "Channel " + chan + " has been deleted, you are now on general"
			});
		})
		this.chans.splice(c);
		console.log("Channel " + chan + " deleted");
		return true;
	}

	private rmFromChan(chan: string, client: Socket) {
		let c = this.getChan(chan);
		if (c != null) {
			console.log("Removing " + this.clients.get(client).name + " from channel " + chan);
			if (this.chans[c].owner == client) {
				this.clearChan(this.chans[c].name, client);
			}
			else {
				if (this.chans[c].admins.indexOf(client) != -1)
					this.chans[c].admins.splice(this.chans[c].admins.indexOf(client));
				this.chans[c].users.delete(client);
			}
		}
	}

	private checkOp(client: Socket, chan: string = ""): boolean {
		if (chan.length == 0)
			chan = this.clients.get(client).chan;
		let c = this.getChan(chan);
		if (this.chans[c].owner == client || this.chans[c].admins.indexOf(client) != -1)
			return true;
		return false;
	}

	private getClient(client: string): Socket {
		for (let [key, value] of this.clients) {
			if (value.name == client)
				return key;
		}
		return null;
	}

	execute(msg: ChatMessage, client: Socket) {
		if (this.clients.has(client) == false)
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

			case "/unmute":
				msg.name = "";
				if (Arr.length < 2) {
					msg.msg = "Wrong number of arguments";
					client.emit('recv_message', msg);
					return;
				}
				if (this.clients.has(client) == true) {
					if (this.checkOp(client) == false) {
						msg.msg = "You can't operate this channel";
						client.emit('recv_message', msg);
						return;
					}
					let u = this.getClient(Arr[1]);
					let c = this.getChan(this.clients.get(client).chan);
					if (this.chans[c].users.has(u) == false) {
						msg.msg = "Can't find user " + Arr[1];
						client.emit('recv_message', msg);
						return;
					}
					if (this.checkOp(u) == true) {
						msg.msg = "You can't unmute another operator";
						client.emit('recv_message', msg);
						return;
					}
					this.chans[c].users.get(u)[0] = 0;
					this.chans[c].users.get(u)[1] = 0;
					msg.msg = "You are unmuted from channel " + this.chans[c].name;
					u.emit('recv_message', msg);
					msg.msg = "User " + Arr[1] + " is unmuted from channel " + this.chans[c].name;
					client.emit('recv_message', msg);
				}
				return;

			case "/mute":
				msg.name = "";
				if (Arr.length < 3) {
					msg.msg = "Wrong number of arguments";
					client.emit('recv_message', msg);
					return;
				}
				if (this.clients.has(client) == true) {
					if (this.checkOp(client) == false) {
						msg.msg = "You can't operate this channel";
						client.emit('recv_message', msg);
						return;
					}
					let u = this.getClient(Arr[1]);
					let c = this.getChan(this.clients.get(client).chan);
					if (this.chans[c].users.has(u) == false) {
						msg.msg = "Can't find user " + Arr[1];
						client.emit('recv_message', msg);
						return;
					}
					if (this.checkOp(u) == true) {
						msg.msg = "You can't mute another operator";
						client.emit('recv_message', msg);
						return;
					}
					let d = new Date();
					this.chans[c].users.get(u)[0] = d.getTime();
					this.chans[c].users.get(u)[1] = parseInt(Arr[2]);
					msg.msg = "You are muted from channel " + this.chans[c].name + " for " + parseInt(Arr[2]) + " seconds";
					u.emit('recv_message', msg);
					msg.msg = "User " + Arr[1] + " is muted from channel " + this.chans[c].name + " for " + parseInt(Arr[2]) + " seconds";
					client.emit('recv_message', msg);
				}
				return;

			case "/unban":
				msg.name = "";
				if (Arr.length < 2) {
					msg.msg = "Wrong number of arguments";
					client.emit('recv_message', msg);
					return;
				}
				if (this.clients.has(client) == true) {
					if (this.checkOp(client) == false) {
						msg.msg = "You can't operate this channel";
						client.emit('recv_message', msg);
						return;
					}
					let u = this.getClient(Arr[1]);
					let c = this.getChan(this.clients.get(client).chan);
					if (this.chans[c].users.has(u) == false) {
						msg.msg = "Can't find user " + Arr[1];
						client.emit('recv_message', msg);
						return;
					}
					if (this.checkOp(u) == true) {
						msg.msg = "You can't unban another operator";
						client.emit('recv_message', msg);
						return;
					}
					this.chans[c].users.get(u)[0] = 0;
					msg.msg = "You are unbanned from channel " + this.chans[c].name;
					u.emit('recv_message', msg);
					msg.msg = "User " + Arr[1] + " is unbanned from channel " + this.chans[c].name;
					client.emit('recv_message', msg);
				}
				return;

			case "/ban":
				msg.name = "";
				if (Arr.length < 2) {
					msg.msg = "Wrong number of arguments";
					client.emit('recv_message', msg);
					return;
				}
				if (this.clients.has(client) == true) {
					if (this.checkOp(client) == false) {
						msg.msg = "You can't operate this channel";
						client.emit('recv_message', msg);
						return;
					}
					let u = this.getClient(Arr[1]);
					let c = this.getChan(this.clients.get(client).chan);
					if (this.chans[c].users.has(u) == false) {
						msg.msg = "Can't find user " + Arr[1];
						client.emit('recv_message', msg);
						return;
					}
					if (this.checkOp(u) == true) {
						msg.msg = "You can't ban another operator";
						client.emit('recv_message', msg);
						return;
					}
					this.chans[c].users.get(u)[0] = -1;
					msg.msg = "You are banned from channel " + this.chans[c].name;
					u.emit('recv_message', msg);
					msg.msg = "User " + Arr[1] + " is banned from channel " + this.chans[c].name;
					client.emit('recv_message', msg);
				}
				return;

			case "/pwd":
				msg.name = "";
				if (Arr.length < 2) {
					msg.msg = "Wrong number of arguments";
					client.emit('recv_message', msg);
					return;
				}
				if (this.clients.has(client) == true) {
					let chan = this.getChan(this.clients.get(client).chan);
					if (this.chans[chan].owner != client) {
						msg.msg = "You do not own this channel";
						client.emit('recv_message', msg);
						return;
					}
					this.chans[chan].passwd = Arr[1];
					msg.msg = "Channel " + this.chans[chan].name + " has a new password";
					client.emit('recv_message', msg);
				}
				return;

			case "/rmpwd":
				msg.name = "";
				if (this.clients.has(client) == true) {
					let chan = this.getChan(this.clients.get(client).chan);
					if (this.chans[chan].owner != client) {
						msg.msg = "You do not own this channel";
						client.emit('recv_message', msg);
						return;
					}
					this.chans[chan].passwd = "";
					msg.msg = "Channel " + this.chans[chan].name + " has no password";
					client.emit('recv_message', msg);
				}
				return;

			case "/public":
				msg.name = "";
				if (this.clients.has(client) == true) {
					let chan = this.getChan(this.clients.get(client).chan);
					if (this.chans[chan].owner != client) {
						msg.msg = "You do not own this channel";
						client.emit('recv_message', msg);
						return;
					}
					this.chans[chan].type = "public";
					msg.msg = "Channel " + this.chans[chan].name + " is now public";
					client.emit('recv_message', msg);
				}
				return;

			case "/private":
				msg.name = "";
				if (this.clients.has(client) == true) {
					let chan = this.getChan(this.clients.get(client).chan);
					if (this.chans[chan].owner != client) {
						msg.msg = "You do not own this channel";
						client.emit('recv_message', msg);
						return;
					}
					this.chans[chan].type = "private";
					msg.msg = "Channel " + this.chans[chan].name + " is now private";
					client.emit('recv_message', msg);
				}
				return;

			case "/pm":
				if (Arr.length < 2) {
					msg.name = "";
					msg.msg = "Wrong number of arguments";
					client.emit('recv_message', msg);
					return;
				}
				if (this.clients.has(client) == true) {
					let u = this.getClient(Arr[1]);
					if (u == null) {
						msg.name = "";
						msg.msg = "Can't find user " + Arr[1];
						client.emit('recv_message', msg);
						return;
					}
					if (this.clients.get(u).blocked.indexOf(u) == -1) {
						u.emit('recv_message', msg);
					}
				}
				return;

			case "/unblock":
				msg.name = "";
				if (Arr.length < 2) {
					msg.msg = "Wrong number of arguments";
					client.emit('recv_message', msg);
					return;
				}
				if (this.clients.has(client) == true) {
					let u = this.getClient(Arr[1]);
					if (u == null) {
						msg.msg = "Can't find user " + Arr[1];
						client.emit('recv_message', msg);
						return;
					}
					if (this.clients.get(client).blocked.indexOf(u) != -1) {
						this.clients.get(client).blocked.splice(this.clients.get(client).blocked.indexOf(u));
						msg.msg = "User " + Arr[1] + " is unblocked";
					}
					else
						msg.msg = "User " + Arr[1] + " isn't blocked";
					client.emit('recv_message', msg);
				}
				return;

			case "/block":
				msg.name = "";
				if (Arr.length < 2) {
					msg.msg = "Wrong number of arguments";
					client.emit('recv_message', msg);
					return;
				}
				if (this.clients.has(client) == true) {
					let u = this.getClient(Arr[1]);
					if (u == null) {
						msg.msg = "Can't find user " + Arr[1];
						client.emit('recv_message', msg);
						return;
					}
					this.clients.get(client).blocked.push(u);
					msg.msg = "User " + Arr[1] + " is blocked";
					client.emit('recv_message', msg);
				}
				return;

			case "/leave":
				msg.name = "";
				if (this.clients.has(client) == true) {
					this.rmFromChan(this.clients.get(client).chan, client);
					this.addToChan("general", client);
					this.clients.get(client).chan = "general";
					msg.msg = "Channel left, back to general";
					client.emit('recv_message', msg);
				}
				return;

			case "/join":
				msg.name = "";
				if (Arr.length < 2) {
					msg.msg = "Wrong number of arguments";
					client.emit('recv_message', msg);
					return;
				}
				let c = this.getChan(Arr[1]);
				if (c == null) {
					msg.msg = "Channel " + Arr[1] + " doesn't exist";
					client.emit('recv_message', msg);
					return;
				}
				if (this.chans[c].passwd != null && this.chans[c].owner != client) {
					if (Arr.length < 3) {
						msg.msg = "This channel requires a password to join";
						client.emit('recv_message', msg);
						return;
					}
					if (this.chans[c].passwd != Arr[2]) {
						msg.msg = "Wrong password";
						client.emit('recv_message', msg);
						return;
					}
				}
				if (this.clients.has(client) == true) {
					this.clients.get(client).chan = Arr[1];
					this.chans[c].users.set(client, [0, 0]);
					msg.msg = "Moved to channel " + Arr[1];
					client.emit('recv_message', msg);
				}
				return;

			case "/op":
				msg.name = "";
				if (Arr.length < 2) {
					msg.name = "";
					msg.msg = "Wrong number of arguments";
					client.emit('recv_message', msg);
					return;
				}
				if (this.clients.has(client) == true) {
					let chan = this.getChan(this.clients.get(client).chan);
					if (this.chans[chan].owner != client) {
						msg.msg = "You do not own this channel";
						client.emit('recv_message', msg);
						return;
					}
					let k = this.getClient(Arr[1]);
					if (k == null) {
						msg.msg == "Can't find user " + Arr[1];
						client.emit('recv_message', msg);
						return;
					}
					if (this.chans[chan].owner == k)
						return;
					if (this.chans[chan].admins.indexOf(k) != -1) {
						this.chans[chan].admins.splice(this.chans[chan].admins.indexOf(k));
						msg.msg = "You are not an operator of this channel anymore";
						k.emit('recv_message', msg);
						msg.msg = "User " + Arr[1] + " is not an operator anymore";
					}
					else {
						this.chans[chan].admins.push(k);
						msg.msg = "You are now an operator of this channel";
						k.emit('recv_message', msg);
						msg.msg = "User " + Arr[1] + " is now an operator";
					}
					client.emit('recv_message', msg);
				}
				return;

			case "/kick":
				msg.name = "";
				if (Arr.length < 2) {
					msg.name = "";
					msg.msg = "Wrong number of arguments";
					client.emit('recv_message', msg);
					return;
				}
				if (this.clients.has(client) == true) {
					if (this.checkOp(client) == false) {
						msg.msg = "You can't operate this channel";
						client.emit('recv_message', msg);
						return;
					}
					let k = this.getClient(Arr[1]);
					if (k == null) {
						msg.msg == "Can't find user " + Arr[1];
						client.emit('recv_message', msg);
						return;
					}
					let v = this.clients.get(k);
					v.chan = "general";
					this.rmFromChan("general", k);
					this.addToChan("general", k);
					msg.msg = "You've been kicked";
					k.emit('recv_message', msg);
					msg.msg = "Kicked " + Arr[1] + " from channel";
					client.emit('recv_message', msg);
				}
				return;

			case "/chans":
				msg.name = "";
				msg.msg = "Channels:\n";
				for (let index = 0; index < this.chans.length; index++) {
					if (this.chans[index].type == "public")
						msg.msg += this.chans[index].name + "\n";
				}
				client.emit('recv_message', msg);
				return;

			case "/users":
				if (this.clients.has(client) == true) {
					msg.name = "";
					let chan = this.getChan(this.clients.get(client).chan);
					msg.msg = "Users:\n";
					this.chans[chan].users.forEach((value, key) => {
						if (this.clients.has(key) == true)
							msg.msg += this.clients.get(key).name + "\n";
					});
					client.emit('recv_message', msg);
				}
				return;

			case "/cchan":
				msg.name = "";
				if (Arr.length < 2)
					msg.msg = "Wrong number of arguments";
				else {
					msg.msg = "Channel " + Arr[1] + " has been created";
					this.chans.push({
						"name": Arr[1],
						"owner": client,
						"admins": [],
						"users": new Map<Socket, [number, number]>([[client, [0, 0]]]),
						"type": Arr.length >= 3 && (Arr[2] == "public" || Arr[2] == "private") ? Arr[2] : "public",
						"passwd": null
					});
					console.log("Chan " + this.getChan(Arr[1]) + " has been created");
					this.rmFromChan(this.clients.get(client).chan, client);
					this.clients.get(client).chan = Arr[1];
				}
				client.emit('recv_message', msg);
				return;

			case "/dchan":
				msg.name = "";
				if (Arr.length < 2)
					msg.msg = "Wrong number of arguments";
				else {
					if (this.clearChan(Arr[1], client) == true)
						msg.msg = "Channel " + Arr[1] + " has been deleted";
					else
						msg.msg = "Can't delete channel " + Arr[1];
				}
				client.emit('recv_message', msg);
				return;

			default:
				if (this.clients.has(client) == true) {
					let c = this.getChan(this.clients.get(client).chan);
					if (c != null) {
						if (this.chans[c].users.has(client) == true) {
							if (this.chans[c].users.get(client)[0] == -1) { //! AAAAAAAAAAAAAAAAAAAAAAA
								msg.name == "";
								msg.msg == "You are banned";
								client.emit('recv_message', msg);
								return;
							}
							if (this.chans[c].users.get(client)[0] > 0) {
								let d = new Date();
								if ((d.getTime() / 1000) - this.chans[c].users.get(client)[0] >= this.chans[c].users.get(client)[1]) {
									this.chans[c].users.get(client)[0] = 0;
									this.chans[c].users.get(client)[1] = 0;
								}
								else {
									let d = new Date();
									msg.name = "";
									msg.msg = "You are muted for " + (this.chans[c].users.get(client)[0] - (d.getTime() / 1000) - this.chans[c].users.get(client)[1]) + " seconds";
									client.emit('recv_message', msg);
									return;
								}
							}
						}
						else
							return;
						this.chans[c].users.forEach((value, key) => {
							if (this.clients.has(key) == true) {
								if (this.clients.get(key).blocked.indexOf(key) != -1)
									return;
								key.emit('recv_message', msg);
							}
						});
					}
				}
				return;
		}
	}

	addClient(name: string, client: Socket) {
		this.clients.set(client, {
			"name": name,
			"chan": "general",
			"blocked": []
		});
		this.addToChan("general", client);
	}

	rmClient(client: Socket) {
		if (this.clients.has(client) == true) {
			this.rmFromChan(this.clients.get(client).chan, client);
			this.clients.delete(client);
		}
	}
}
