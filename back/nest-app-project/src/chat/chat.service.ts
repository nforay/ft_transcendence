import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { UserManager } from '../user/user.model';
import { ChanService } from './chan.service';
import { ChatCommandHandlers } from './chat.commands';

export class ClientIdentifier {
	sock: Socket;
	chan: string;
}

export class ChatUsersManager {
	public static users: Map<string, ClientIdentifier> = new Map<string, ClientIdentifier>();
}

@Injectable()
export class ChatService {
	// public users: Map<string, ClientIdentifier> = new Map<string, ClientIdentifier>();
	public users = ChatUsersManager.users;

	constructor(private chanService: ChanService, private chatCommandHandlers: ChatCommandHandlers) {
    chanService.chatService = this;
  }

	getUsers(): Map<string, ClientIdentifier> {
		return this.users;
	}

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

    if (msg.length > 250) {
      client.emit("recv_message", { name: "", msg: "Message too long. You will be disconnected", isCommandResponse: true });
      client.disconnect(true);
      return;
    }

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
      "/ban": this.chatCommandHandlers.muteCommand,
      "/mute": this.chatCommandHandlers.muteCommand,
      "/unmute": this.chatCommandHandlers.unmuteCommand,
      "/unban": this.chatCommandHandlers.unmuteCommand,
      "/leave": this.chatCommandHandlers.leaveCommand,
      "/passwd": this.chatCommandHandlers.passwdCommand,
      "/rmpasswd": this.chatCommandHandlers.passwdCommand
    }

    if (Arr[0] in commands) {
      const data = await commands[Arr[0]](client, Arr, uname, this.users, this.chanService);
      if (Arr[0] !== "/pm")
        client.emit("recv_message", { ...data, isCommandResponse: true })

    } else if (Arr[0].startsWith('/')) {
      client.emit("recv_message", { name: "", msg: "Command not found.", isCommandResponse: true })
    } else {
      const c = this.users.get(uname).chan;
      const banData = await this.chanService.checkban(c, uname); //throw
      const muteData = await this.chanService.checkmute(c, uname);

      if (banData && !banData.expired()) {
        name = "";
        msg = 'You are banned from this channel ' + banData.getFormattedTime() + '.\nReason: "' + banData.reason + '".';
        client.emit('recv_message', { name, msg, isCommandResponse: true });
        return;
      }
      if (muteData && !muteData.expired()) {
        name = "";
        msg = 'You are muted from this channel ' + muteData.getFormattedTime() + '.\nReason: "' + muteData.reason + '".';
        client.emit('recv_message', { name, msg, isCommandResponse: true });
        return;
      }

      const cusers = this.chanService.getUsers(c).sort((a, b) => a.localeCompare(b));
      const where = cusers.map(x => { return { id: x }});
      let db_cusers = await UserManager.instance.userRepository.find({where});
      db_cusers.sort((a, b) => a.id.localeCompare(b.id))
      if (!db_cusers) {
        client.emit('recv_message', { name: "", msg: "Unexpected error", isCommandResponse: true });
        return;
      }

      for (let index = 0; index < cusers.length; index++) {
        const toBanData = await this.chanService.checkban(c, cusers[index]);
        if (!db_cusers[index].isBlocking(uname) && (!toBanData || toBanData.expired())) {
          this.users.get(cusers[index]).sock.emit('recv_message', { name, msg, isCommandResponse: false });
        }
      }
    }
	}

	async addClient(uname: string, client: Socket) {
		this.users.set(uname, {
			sock: client,
			chan: "general",
		});
		await this.chanService.join(client, "general", uname);
	}

	rmClient(client: Socket) {
    let uname = this.getUserFromSocket(client);
		if (uname != null) {
			this.chanService.leave(this.users.get(uname).chan, uname);
			this.users.delete(uname);
		}
	}
}
