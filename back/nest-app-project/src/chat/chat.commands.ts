import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { UserManager } from 'src/user/user.model';
import { ChanService } from './chan.service';
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
    msg += "\n/join <channel> (<password>) Join a channel";
    msg += "\n/leave Shortcut for \"/join general\"";
    msg += "\n/pm <user> <message> Send a private message to some user";
    msg += "\n/block <user> Block messages from some user or list blocked user if no argument is provided";
    msg += "\n/unblock <user> Unblock messages from some user";
    // msg += "\n/challenge <user> Challenge user to a pong game";
    // msg += "\n/y (<user>) Accept the last challenge or a challenge from a specific user";
    msg += "\n/cchan <name> (<public/private>) Create a new channel";
    msg += "\n/dchan <name> Delete a channel";
    msg += "\n/op <user> Make a user a channel operator, if the user is already an operator it removes his priviledges if no argument is provided list channel operators";
    msg += "\n/kick <user> Kick a user back to the general channel without banning him";
    msg += "\n/ban <user> Ban user";
    msg += "\n/unban <user> Unban user";
    msg += "\n/mute <user> <seconds> Mute user for x seconds";
    msg += "\n/unmute <user> Unmute user";
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
      const where = users.get(uname).blocked.map(x => { return { id: x }; });
      const db_users = await UserManager.instance.userRepository.find({ where });
      if (!db_users) {
        msg = "No blocked users found";
        return {name, msg}
      }

      msg = "Blocked users: " + db_users[0].name;
      for (let i = 1; i < db_users.length; i++) {
        msg += ', ' + db_users[i].name;
      }
      return {name, msg}
    }

    const user = await UserManager.instance.userRepository.findOne({ where: { name: args[1] } });
    if (!user) {
      msg = "User not found";
      return {name, msg}
    }
    users.get(uname).blocked.push(user.id);
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
    if (!user) {
      msg = "User not found";
      return {name, msg}
    }
    let b = users.get(uname).blocked.indexOf(user.id);
    if (b == -1) {
      msg = "User " + args[1] + " isn't blocked";
      return {name, msg}
    }

    users.get(uname).blocked.splice(b, 1);
    msg = "User " + args[1] + " is unblocked";

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
    if (users.get(target.id).blocked.indexOf(uname) != -1) {
      msg = "You are blocked";
      client.emit('recv_message', { name, msg, isCommandResponse: true });
      return {name , msg};
    }
    for (let index = 2; index < args.length; index++) {
      msg += args[index] + " ";
    }
    msg = msg.trimEnd();

    const from = await UserManager.instance.userRepository.findOne({ where: { id: uname } });
    if (!from) {
      msg = "Unknown error"
      client.emit('recv_message', { name, msg, isCommandResponse: true });
      return {name , msg};
    }

    users.get(target.id).sock.emit('recv_message', { name, msg: "Message recieved from " + from.name + ": " + msg });
    client.emit('recv_message', { name, msg: "Message sent to " + args[1] + ": " + msg });
    return {name, msg}
  }

  cchanCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = "";
    let msg = ""
    let pass = null
    
    if (args.length < 2 || args.length > 4) {
      msg = "Wrong number of arguments";
      return {name, msg}
    }
    if (args.length >= 3 && args[2] != "private" && args[2] != "public") {
      msg = "Second argument must be either \'private\' or \'public\'";
      return {name, msg}
    }
    if (args.length == 4) {
      pass = args[3]
    }
    
    try {
      const res = chanService.cchan(args[1], uname, pass)
      msg = res;
      if (args.length == 3 && args[2] == "public")
        chanService.setpublic(args[1], uname);
      try {
        chanService.leave(users.get(uname).chan, uname);
        chanService.join(args[1], uname, pass);
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
        const ret = chanService.dchan(args[1], uname)
        msg = ret;
        for (let index = 0; index < cusers.length; index++) {
          if (users.has(cusers[index]) && users.get(cusers[index]).blocked.indexOf(uname) == -1) {
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

  joinCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = "";
    let msg = ""
    if (args.length < 2 || args.length > 3) {
      msg = "Wrong number of arguments";
    }
    else if (args.length == 2) {
      try {
        chanService.leave(users.get(uname).chan, uname);
        const res = chanService.join(args[1], uname);
        msg = res;
        users.get(uname).chan = args[1];
      } catch (err: any) {
        Logger.log(err);
        msg = err;
      }
    }
    else if (args.length == 3) {
      try {
        chanService.leave(users.get(uname).chan, uname);
        const res = chanService.join(args[1], uname, args[2]);
        msg = res;
        users.get(uname).chan = args[1];
      } catch (err: any) {
        msg = err;
      }
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
        chanService.leave(users.get(args[1]).chan, args[1]);
        chanService.join("general", args[1]);
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

  async banCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = "";
    let msg = ""
    
    if (args.length != 2) {
      msg = "Wrong number of argmuents";
    }
    else {
      try {
        const isAdmin = await chanService.checkadmin(users.get(uname).chan, uname)
        if (isAdmin == false) {
          msg = "You are not operator of this channel";
          return {name, msg};
        }

        const res = chanService.ban(users.get(uname).chan, args[1]);
        msg = res;

      } catch (err) {
        msg = "Can't find channel";
      }
    }
    return {name, msg}
  }

  async muteCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = "";
    let msg = ""
    
    if (args.length != 3) {
      msg = "Wrong number of argmuents";
      return {name, msg};
    }
    try {
      const isAdmin = await chanService.checkadmin(users.get(uname).chan, uname)
      if (isAdmin == false) {
        msg = "You are not operator of this channel";
        return {name, msg};
      }
      
      let dur = parseInt(args[2], 10);
      if (dur != NaN && dur > 0) {
        const res = chanService.ban(users.get(uname).chan, args[1], dur)
        msg = res;
      }
      else
        msg = "Wrong duration";
    } catch (err) {
      msg = "Can't find channel";
    }
    return {name, msg}
  }

  async unmuteCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = "";
    let msg = ""
    if (args.length != 2) {
      msg = "Wrong number of arguments";
    }
    else {
      try {
        const res = chanService.unban(users.get(uname).chan, args[1])
        msg = res;
      } catch (err) {
        msg = err;
      }
    }
    return {name, msg}
  }

  leaveCommand(client: Socket, args: string[], uname: string, users: Map<string, ClientIdentifier>, chanService: ChanService) {
    const name = "";
    let msg = ""
    
    if (args.length != 1) {
      msg = "Wrong number of arguments";
    }
    else {
      try {
        chanService.leave(users.get(uname).chan, uname);
        const res = chanService.join("general", uname)
        msg = res;
        users.get(uname).chan = "general";
      } catch (err) {
        msg = err;
      }
    }
    return {name, msg}
  }
}
