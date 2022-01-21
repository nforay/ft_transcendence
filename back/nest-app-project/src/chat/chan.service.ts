import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { channel } from 'diagnostics_channel';
import { Socket } from 'socket.io';
import { UserManager } from '../user/user.model';
import { BanData, ChanEntity } from './chan.entity';
import { ChatService, ClientIdentifier } from './chat.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ChanManager
{
  public static instance: ChanManager = new ChanManager()
  public chans: Array<ChanEntity> = []

  findByName(name: string) {
    return this.chans.find(chan => chan.name === name)
  }

  async create(name: string, owner: string, args?: any) {
    if (this.findByName(name) !== undefined)
      throw "Channel Already Exists"
    let chan = new ChanEntity(name, owner, args)
    if (args.passwd)
      chan.passwd = await bcrypt.hash(args.passwd, 10)
    this.chans.push(chan)
    return chan
  }

	delete(name : string) {
    const chan = this.findByName(name)
		if (chan === undefined)
      throw "Channel doesn't exists"
		if (chan.name == "general")
			throw "You cannot delete this channel"
		this.chans.splice(this.chans.indexOf(chan), 1)
	}

	getPublicChannels() {
    return this.chans.filter(chan => chan.type === "public")
  }

  @Interval(1000 * 60 * 5)
  pruneExpiredSanctions() {
    for (let chan of ChanManager.instance.chans)
    {
      for (let ban of chan.bans.values()) {
        if (ban.expired())
          chan.unbanUser(ban.id)
      }
      for (let mute of chan.mutes.values()) {
        if (mute.expired())
          chan.unmuteUser(mute.id)
      }
    }
  }
}

@Injectable()
export class ChanService {
  public chatService: ChatService;

	constructor() {
    const chan = ChanManager.instance.findByName("general");
    if (chan)
      return;

  	ChanManager.instance.create("general", "", { type: "public" }).then(() => {}).catch(e => {
      Logger.log(e);
    });
	}

	findAll(): string[] {
		let tab : string[] = [];
		for (let index = 0; index < ChanManager.instance.chans.length; index++) {
			tab.push(ChanManager.instance.chans[index].name);
		}
		return tab;
	}

	getPublicChannels(): string[] {
		const chans = ChanManager.instance.getPublicChannels();
		if (!chans || chans.length == 0)
			throw "There is no public channels";
		let ret: string[] = new Array<string>();
		for (let key = 0; key < chans.length; key++) {
			ret.push(chans[key].name);
		}
		return ret;
	}

	getUsers(cname: string): string[] {
		const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel";
		return chan.users;
	}

  async changePasswd(cname: string, newpass: string): Promise<string> {
    const chan = ChanManager.instance.findByName(cname);
    if (!chan)
      throw "Can't find channel";
    if (newpass)
      chan.passwd = await bcrypt.hash(newpass, 10);
    else
      chan.passwd = null;
    return "Password changed";
  }

	async op(cname: string, uname: string, newop: string = null): Promise<string> {
		const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel"
		let ret = await chan.op(uname, newop);
		return ret;
	}

	async checkadmin(cname: string, uname: string): Promise<boolean> {
		const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel"
		let ret = await chan.checkadmin(uname);
		return ret;
	}

	async checkowner(cname: string, uname: string): Promise<boolean> {
		const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel"
		let ret = await chan.checkowner(uname);
		return ret;
	}

	async leave(cname: string, uname: string): Promise<string> {
		const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel";
		chan.rmUser(uname);
    if (chan.users.length == 0)
    {
      try { ChanManager.instance.delete(cname); }
      catch (err) {}
      return "Left channel " + cname;
    }

    const cusers = chan.users;
    const user = await UserManager.instance.userRepository.findOne({ where: { id: uname }});
    if (!user)
      return "Unexpected error occured";

    for (let index = 0; index < cusers.length; index++) {
      const toBanData = await this.checkban(cname, cusers[index]);

      if (this.chatService.users.has(cusers[index]) && (!toBanData || toBanData.expired())) {
        this.chatService.users.get(cusers[index]).sock.emit('recv_message', { name: "", msg: user.name + " left this channel!", isCommandResponse: true });
      }
    }

    if (chan.owner === uname)
      chan.owner = chan.users[0];
		return "Left channel " + cname;
	}

  async checkPassword(cname: string, pass: string) {
    const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel";
    if (chan.passwd)
		  return !pass ? false : await bcrypt.compare(pass, chan.passwd);
    return pass == null;
  }

	async join(client: Socket, cname: string, uname: string, pwd: string = null, dry: boolean = false) : Promise<string> {
		const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel";
    const user = await UserManager.instance.userRepository.findOne({ where: { id: uname }});
    if (!user)
      return "Unexpected error occured";
    const correctPass = await this.checkPassword(cname, pwd);
    if (!correctPass && user.role !== 'admin')
      throw "Wrong password";
    if (!dry) {
      const cusers = chan.users;

      for (let index = 0; index < cusers.length; index++) {
        const toBanData = await this.checkban(cname, cusers[index]);

        if (this.chatService.users.has(cusers[index]) && (!toBanData || toBanData.expired())) {
          this.chatService.users.get(cusers[index]).sock.emit('recv_message', { name: "", msg: user.name + " joined this channel!", isCommandResponse: true });
        }
      }
      chan.addUser(uname)
      client.emit('switch_channel', { channel: cname });
    }
		return "Moved to channel " + cname;
	}

	async cchan(cname: string, newowner: string, pass: string): Promise<string> {
		const chan = ChanManager.instance.findByName(cname);
		if (chan)
			throw "Channel already exists"

		await ChanManager.instance.create(cname, newowner, { passwd: pass });
		return "Channel " + cname + " has been created";
	}

	async dchan(users: Map<string, ClientIdentifier>, cname: string, uname: string): Promise<string> {
		const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel";
		if ((await chan.checkowner(uname)) == false)
			throw "You are not the owner of this channel";
		for (let index = 0; index < chan.users.length; index++) {
      const user = users.get(chan.users[index]);
      if (!user)
        continue;
			this.join(user.sock, "general", chan.users[index]);
		}
		ChanManager.instance.delete(cname);
		return "Channel " + cname + " has been deleted";
	}

	setpublic(cname: string, uname: string) {
    const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel";
		if (chan.settype(uname, "public") == false)
			throw "You are not the owner of this channel";
		return "Channel " + cname + " set to public";
	}

	setprivate(cname: string, uname: string) {
		const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel";
		if (chan.settype(uname, "private") == false)
			throw "You are not the owner of this channel"
		return "Channel " + cname + " set to private";
	}

	async checkban(cname: string, uname: string): Promise<BanData> {
		const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel"
		const ret = await chan.checkban(uname);
    return ret;
	}

  async checkmute(cname: string, uname: string): Promise<BanData> {
		const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel"
    const ret = await chan.checkmute(uname);
		return ret;
	}

	async ban(cname: string, uname: string, banMode: boolean, reason?: string, duration?: number): Promise<string> {
		const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			 throw "Can't find channel";

    const user = await UserManager.instance.userRepository.findOne({ where: { name: uname }})
    if (!user)
      throw "User doesn't exists"

    const isAdmin = await this.checkadmin(cname, user.id);
    if (isAdmin)
      throw "You cannot ban or mute an operator user"

    if (banMode) {
		  const banData = await chan.banUser(user.id, reason, duration);
      return "Banned user " + uname + " from channel " + cname + " " + banData.getFormattedTime();
    }
    const muteData = await chan.muteUser(user.id, reason, duration);
  	return "Muted user " + uname + " from channel " + cname + " " + muteData.getFormattedTime();
	}

	async unban(cname: string, uname: string): Promise<string> {
		const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel"
    const user = await UserManager.instance.userRepository.findOne({ where: { name: uname }})
    if (!user)
      throw "User doesn't exists"
		chan.unbanUser(user.id);
		return "Unbanned user " + uname + " from channel " + cname;
	}

  async unmute(cname: string, uname: string): Promise<string> {
		const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel"
    const user = await UserManager.instance.userRepository.findOne({ where: { name: uname }})
    if (!user)
      throw "User doesn't exists"
		chan.unmuteUser(user.id);
		return "Unbanned user " + uname + " from channel " + cname;
	}
}
