import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Socket } from 'socket.io';
import { UserManager } from 'src/user/user.model';
import { BanData, ChanEntity } from './chan.entity';
import { ChatService, ClientIdentifier } from './chat.service';

@Injectable()
export class ChanManager
{
  public static instance: ChanManager = new ChanManager()
  public chans: Array<ChanEntity> = []

  findByName(name: string) {
    return this.chans.find(chan => chan.name === name)
  }

  create(name: string, owner: string, args?: any) {
    if (this.findByName(name) !== undefined)
      throw "Channel Already Exists"
    const chan = new ChanEntity(name, owner, args)
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

    try {
    	ChanManager.instance.create("general", "", { type: "public" });
    } catch (e) {
      Logger.log(e);
    }
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

  changePasswd(cname: string, newpass: string): string {
    const chan = ChanManager.instance.findByName(cname);
    if (!chan)
      throw "Can't find channel";
    chan.passwd = newpass;
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

  checkPassword(cname: string, pass: string) {
    const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel";
		return chan.passwd === pass;
  }

	async join(client: Socket, cname: string, uname: string, pwd: string = null, dry: boolean = false) : Promise<string> {
		const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel";
    if (pwd !== chan.passwd)
      throw "Wrong password";
    if (!dry) {
      const cusers = chan.users;
      const user = await UserManager.instance.userRepository.findOne({ where: { id: uname }});
      if (!user)
        return "Unexpected error occured";

      for (let index = 0; index < cusers.length; index++) {
        const toBanData = await this.checkban(cname, cusers[index]);

        if (this.chatService.users.has(cusers[index]) && (!toBanData || toBanData.expired())) {
          this.chatService.users.get(cusers[index]).sock.emit('recv_message', { name: "", msg: user.name + " joined this channel!", isCommandResponse: true });
        }
      }
      chan.addUser(uname, pwd)
      client.emit('switch_channel', { channel: cname });
    }
		return "Moved to channel " + cname;
	}

	cchan(cname: string, newowner: string, pass: string): string {
		const chan = ChanManager.instance.findByName(cname);
		if (chan)
			throw "Channel already exists"

		ChanManager.instance.create(cname, newowner, { passwd: pass });
		return "Channel " + cname + " has been created";
	}

	dchan(users: Map<string, ClientIdentifier>, cname: string, uname: string): string {
		const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel";
		if (chan.checkowner(uname) == false)
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
      throw "You cannot ban or mute this user"

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
