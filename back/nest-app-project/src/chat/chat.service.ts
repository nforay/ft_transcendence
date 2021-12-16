import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ChanService } from './chan.service';
import { ChatCommandHandlers } from './chat.commands';

export class ClientIdentifier {
	sock: Socket;
	chan: string;
	blocked: string[];
}

@Injectable()
export class ChatService {
	private users: Map<string, ClientIdentifier> = new Map<string, ClientIdentifier>();

	constructor(private chanService: ChanService, private chatCommandHandlers: ChatCommandHandlers) {}

	private getUserFromSocket(sock: Socket): string {
		for (let [key, value] of this.users) {
			if (value.sock == sock)
				return key;
		}
		return null;
	}
  
	async execute(name: string, msg: string, client: Socket) {
    //! Rajouter:
    //! /challenge <user>
    //TODO /y (<user>) accepter le dernier challenge ou le challenge d'un utilisateur
    //! Bugs:
    //! Quitter et rejoindre un channel fait perdre le status de ban ou mute
    //! Si le owner join un autre chan son chan n'est pas supprimé

    let uname = this.getUserFromSocket(client);
		if (uname == null)
			return;
		const Arr = msg.split(" ");

    const commands = {
      "/ping": this.chatCommandHandlers.pingCommand,
      "/help": this.chatCommandHandlers.helpCommand,
      "/chans": this.chatCommandHandlers.chansCommand,
      "/users": this.chatCommandHandlers.usersCommand,
      "/op": this.chatCommandHandlers.opCommand,
      "/block": this.chatCommandHandlers.blockCommand,
      "/unblock": this.chatCommandHandlers.unblockCommand,
      "/pm": this.chatCommandHandlers.pmCommand,
      "/cchan": this.chatCommandHandlers.cchanCommand,
      "/dchan": this.chatCommandHandlers.dchanCommand,
      "/join": this.chatCommandHandlers.joinCommand,
      "/kick": this.chatCommandHandlers.kickCommand,
      "/ban": this.chatCommandHandlers.banCommand,
      "/mute": this.chatCommandHandlers.muteCommand,
      "/unmute": this.chatCommandHandlers.unmuteCommand,
      "/unban": this.chatCommandHandlers.unmuteCommand,
      "/leave": this.chatCommandHandlers.leaveCommand
    }

    if (Arr[0] in commands) {
      const data = await commands[Arr[0]](client, Arr, uname, this.users, this.chanService);
      if (Arr[0] !== "/pm")
        client.emit("recv_message", { ...data, isCommandResponse: true })
      
    } else if (Arr[0].startsWith('/')) {
      client.emit("recv_message", { name: "", msg: "Command not found.", isCommandResponse: true })
    } else {
      let c = this.users.get(uname).chan;
      let banstate = this.chanService.checkban(c, uname);
      switch (banstate) {
        case "-1":
          name = "";
          msg = "You are banned";
          client.emit('recv_message', { name, msg, isCommandResponse: false });
          return;
          
        case "0":
          const cusers = await this.chanService.getUsers(c)
          for (let index = 0; index < cusers.length; index++) {
            if (this.users.has(cusers[index]) && this.users.get(cusers[index]).blocked.indexOf(uname) == -1) {
              this.users.get(cusers[index]).sock.emit('recv_message', { name, msg, isCommandResponse: false });
            }
          }
          return;
  
        default:
          name = "";
          msg = "You are muted for " + banstate + " seconds";
          client.emit('recv_message', { name, msg, isCommandResponse: false });
          return;
      }
    }
	}

	addClient(uname: string, client: Socket) {
		this.users.set(uname, {
			sock: client,
			chan: "general",
			blocked: []
		});
		this.chanService.join("general", uname);
	}

	rmClient(client: Socket) {
    let uname = this.getUserFromSocket(client);
		if (uname != null) {
			this.chanService.leave(this.users.get(uname).chan, uname);
			this.users.delete(uname);
		}
	}
}
