import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { UserManager } from '../user/user.model';
import { ChanManager, ChanService } from './chan.service';
import { ClientIdentifier } from './chat.service';

export class ChatCommandHandlers {

  async pingCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = "";
    const msg = "pong";
    return {name, msg}
  }

  async helpCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = "";
    let msg = "";
    if (args.length != 1) {
      msg = "Wrong number of arguments";
      return {name, msg}
    }
    msg = "/help Print this help";
    msg += "\n/chans List public channels";
    msg += "\n/users List users on this channel";
    msg += "\n/join (channel) [password] Join a channel";
    msg += "\n/leave Shortcut for \"/join general\"";
    msg += "\n/pm (user) (message) Send a private message to some user";
    msg += "\n/block (user) Block messages from some user or list blocked user if no argument is provided";
    msg += "\n/unblock (user) Unblock messages from some user";
    // msg += "\n/challenge <user> Challenge user to a pong game";
    // msg += "\n/y (<user>) Accept the last challenge or a challenge from a specific user";
    msg += "\n/cchan (name) [public | private] Create a new channel";
    msg += "\n/dchan (name) Delete a channel";
    msg += "\n/op (user) Toggle operator permissions for a user, prints a list of channel operators if no argument is provided";
    msg += "\n/kick (user) Kick a user back to general";
    msg += "\n/ban (user) [seconds] [reason] Ban user from channel";
    msg += "\n/unban (user) Unban user";
    msg += "\n/mute (user) [seconds] [reason] Mute user in channel";
    msg += "\n/unmute (user) Unmute user";
		return {name, msg}
  }

  async chansCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = "";
    let msg = ""
    if (args.length != 1) {
      msg = "Wrong number of arguments";
      return {name, msg}
    }
    try {
      const parts = await chanService.getPublicChannels()
      for (let index = 0; index < parts.length; index++) {
        msg += parts[index] + '\n';
      }
      msg = msg.trimEnd();
      msg = "Public channels:\n" + msg;
    } catch (err: any) {
      msg = err;
    }
    return {name, msg}
  }

  async usersCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = ""
    let msg = ""
    if (args.length != 1) {
      msg = "Wrong number of arguments";
    }
    else {
      try {
        const parts = await chanService.getUsers(users.get(uname).chan)
        const where = parts.map(x => { return { id: x }; });
        const db_users = await UserManager.instance.userRepository.find({ where });
        if (!db_users) {
          throw "No users found";
        }
        for (const user of db_users) {
          msg += user.name + '\n';
        }
        msg = msg.trimEnd();
        msg = "Users in " + users.get(uname).chan + ":\n" + msg;
      } catch (err: any) {
        return {name, err}
      }
    }
    return {name, msg}
  }

  async opCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = "";
    let msg = "";
    if (args.length == 1) {
      try {
        const res = await chanService.op(users.get(uname).chan, uname)
        msg = res;
      } catch(err: any) {
        msg = err;
      }
    }
    else if (args.length == 2) {
      const res = await chanService.op(users.get(uname).chan, uname, args[1]);
      msg = res
    }
    else {
      msg = "Wrong number of arguments";
    }
    return { msg, name }
  }

  async blockCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = "";
    let msg = ""
    if (args.length > 2) {
      msg = "Wrong number of arguments";
      return {name, msg}
    }

    if (args.length == 1) {
      const sender = await UserManager.instance.userRepository.findOne({ where: { id: uname } });
      if (!sender) {
        msg = "Unexpected error";
        return {name, msg}
      }
      const where = sender.blocked.map(x => { return { id: x }; });
      const blocked = await UserManager.instance.userRepository.find({ where });
      if (!blocked) {
        msg = "No blocked users found";
        return {name, msg}
      }

      msg = "Blocked users: " + blocked[0].name;
      for (let i = 1; i < blocked.length; i++) {
        msg += ', ' + blocked[i].name;
      }
      return {name, msg}
    }

    const user = await UserManager.instance.userRepository.findOne({ where: { name: args[1] } });
    let sender = await UserManager.instance.userRepository.findOne({ where: { id: uname } });
    if (!user || !sender) {
      msg = "User not found";
      return {name, msg}
    }

    if (!sender.block(user.id)) {
      msg = "User " + args[1] + " is already blocked";
      return {name, msg}
    }

    await UserManager.instance.userRepository.save(sender)
    msg = "User " + args[1] + " has been blocked";
    return {name, msg}
  }

  async unblockCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = "";
    let msg = "";

    if (args.length != 2) {
      msg = "Wrong number of arguments";
      return {name, msg}
    }

    const user = await UserManager.instance.userRepository.findOne({ where: { name: args[1] } });
    let sender = await UserManager.instance.userRepository.findOne({ where: { id: uname } });
    if (!user) {
      msg = "User not found";
      return {name, msg}
    }
    if (!sender.unblock(user.id)) {
      msg = "User " + args[1] + " isn't blocked";
      return {name, msg}
    }
    await UserManager.instance.userRepository.save(sender);
    msg = "User " + args[1] + " has been unblocked";

    return {name, msg}
  }

  async pmCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = "";
    let msg = ""
    if (args.length < 3) {
      msg = "Wrong number of arguments";
      client.emit('recv_message', { name, msg, isCommandResponse: true });
      return {name , msg};
    }

    const target = await UserManager.instance.userRepository.findOne({ where: { name: args[1] } });
    if (target.id === uname) {
      msg = "Feeling lonely?";
      client.emit('recv_message', { name, msg, isCommandResponse: true });
      return {name, msg};
    }

    if (!target || !users.has(target.id)) {
      msg = "User " + args[1] + " doesn't exist or isn't connected";
      client.emit('recv_message', { name, msg, isCommandResponse: true });
      return {name , msg};
    }

    const from = await UserManager.instance.userRepository.findOne({ where: { id: uname } });
    const isBlocking = from.isBlocking(target.id);
    if (target.isBlocking(from.id) || isBlocking) {
      msg = isBlocking ? "You are blocking this user" : "You are blocked by this user";
      client.emit('recv_message', { name, msg, isCommandResponse: true });
      return {name, msg};
    }
    for (let index = 2; index < args.length; index++) {
      msg += args[index] + " ";
    }
    msg = msg.trimEnd();

    if (!from) {
      msg = "Unknown error"
      client.emit('recv_message', { name, msg, isCommandResponse: true });
      return {name , msg};
    }

    users.get(target.id).sock.emit('recv_message', { name, msg: "Message recieved from " + from.name + ": " + msg });
    client.emit('recv_message', { name, msg: "Message sent to " + args[1] + ": " + msg });
    return {name, msg}
  }

  async cchanCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = "";
    let msg = ""
    let pass = null

    if (args.length < 2 || args.length > 4) {
      msg = "Wrong number of arguments";
      return {name, msg}
    }

    if (args.length >= 3 && args[2] !== "private" && args[2] !== "public") {
      msg = "Second argument must be either \'private\' or \'public\'";
      return {name, msg}
    }

    if (/^[a-z0-9]+$/i.test(args[1]) === false) {
      msg = "Channel name must be alphanumeric";
      return {name, msg};
    }

    if (args[1].length > 15) {
      msg = "Channel name must be 15 characters or less";
      return {name, msg};
    }

    if (args.length === 4) {
      pass = args[3]
    }

    try {
      const res = chanService.cchan(args[1], uname, pass)
      msg = res;
      if (args.length >= 3 && args[2] === "public")
        chanService.setpublic(args[1], uname);
      try {
        await chanService.leave(users.get(uname).chan, uname);
        await chanService.join(client, args[1], uname, pass);
        users.get(uname).chan = args[1];
      } catch (err) {
        msg = "Unknown error"
      }
    } catch (err) {
      msg = err;
    }
    return {name, msg}
  }

  async dchanCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = "";
    let msg = ""
    if (args.length != 2) {
      msg = "Wrong number of arguments";
      return {name, msg};
    }
    else {
      try {
        const cusers = chanService.getUsers(args[1])
        const ret = await chanService.dchan(users, args[1], uname)
        msg = ret;
        for (let index = 0; index < cusers.length; index++) {
          if (users.has(cusers[index])) {
            users.get(cusers[index]).chan = "general";
            if (cusers[index] != uname)
              users.get(cusers[index]).sock.emit('recv_message', { name, msg, isCommandResponse: true });
          }
        }
      } catch (err) {
        msg = err;
      }
    }
    return {name, msg}
  }

  async joinCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = "";
    let msg = ""
    if (args.length < 2 || args.length > 3) {
      msg = "Wrong number of arguments";
      return {name, msg}
    }
    if (args[1] === users.get(uname).chan) {
      msg = "You are already in that channel";
      return {name, msg}
    }

    try {
      // Dry run to prevent leaving a channel if join is not going to work
      await chanService.join(client, args[1], uname, args.length == 3 ? args[2] : null, true);
      await chanService.leave(users.get(uname).chan, uname);
      const res = await chanService.join(client, args[1], uname, args.length == 3 ? args[2] : null);
      msg = res;
      users.get(uname).chan = args[1];
    } catch (err: any) {
      msg = err;
    }

    return {name, msg}
  }

  async kickCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = "";
    let msg = ""

    if (args.length != 2) {
      msg = "Wrong number of arguments";
    }
    else {
      try {
        const isadmin = await chanService.checkadmin(users.get(uname).chan, uname);
        if (!isadmin) {
          msg = "You are not operator of this channel";
          return {name, msg}
        }
        if (users.has(args[1]) == false) {
          msg = "can't find user " + args[1];
          return {name, msg}
        }
        await chanService.leave(users.get(args[1]).chan, args[1]);
        await chanService.join(client, "general", args[1]);
        users.get(args[1]).chan = "general";
        msg = "You've been kicked";
        users.get(args[1]).sock.emit('recv_message', { name, msg, isCommandResponse: true });
        msg = "kicked user " + args[1];
      } catch(err) {
        msg = "Can't find channel"
      }
    }
    return {name, msg}
  }

  // Also used for ban
  async muteCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = "";
    let msg = ""

    if (args.length < 2) {
      msg = "Wrong number of argmuents";
      return {name, msg};
    }

    try {
      const isAdmin = await chanService.checkadmin(users.get(uname).chan, uname)
      if (isAdmin == false) {
        msg = "You are not operator of this channel";
        return {name, msg};
      }

      let reason = undefined;
      let dur = undefined;
      // Permanent ban
      if (args.length < 3) {
        const res = await chanService.ban(users.get(uname).chan, args[1], args[0] === '/ban')
        msg = res;
        return {name, msg}
      }

      dur = parseInt(args[2], 10);
      if (dur === NaN) {
        reason = args.slice(2).join(" ");
        dur = undefined;
      }
      else if (dur <= 0) {
        msg = "Wrong duration";
        return {name, msg}
      } else {
        reason = args.slice(3).join(" ");
      }

      const res = await chanService.ban(users.get(uname).chan, args[1], args[0] === '/ban', reason, dur);
      msg = res;

    } catch (err) {
      msg = "Can't find channel";
    }
    return {name, msg}
  }

  // Also used for unban
  async unmuteCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = "";
    let msg = ""
    if (args.length != 2) {
      msg = "Wrong number of arguments";
      return {name, msg}
    }
    const isAdmin = await chanService.checkadmin(users.get(uname).chan, uname)
    if (isAdmin == false) {
      msg = "You are not operator of this channel";
      return {name, msg};
    }

    try {
      let res = null;
      if (args[0] === '/unban')
        res = await chanService.unban(users.get(uname).chan, args[1])
      else
        res = await chanService.unmute(users.get(uname).chan, args[1])
      msg = res;
    } catch (err) {
      msg = err;
    }
    return {name, msg}
  }

  async leaveCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = "";
    let msg = ""

    if (args.length != 1) {
      msg = "Wrong number of arguments";
    }
    else {
      try {
        await chanService.leave(users.get(uname).chan, uname);
        const res = await chanService.join(client, "general", uname)
        msg = res;
        users.get(uname).chan = "general";
      } catch (err) {
        msg = err;
      }
    }
    return {name, msg}
  }
}
