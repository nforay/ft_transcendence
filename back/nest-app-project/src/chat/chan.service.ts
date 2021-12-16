import { Injectable, Logger } from '@nestjs/common';
import { ChanEntity } from './chan.entity';

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
}

@Injectable()
export class ChanService {

	constructor(private chanRepo: ChanEntity) {
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
			throw false
		let ret = await chan.checkadmin(uname);
		return ret;
	}

	leave(cname: string, uname: string): string {
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
    chan.owner = chan.users[0]
		return "Left channel " + cname;
	}

	join(cname: string, uname: string, pwd: string = null): string {
		const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel";
		if (chan.addUser(uname, pwd) == false)
			throw "Wrong password";
		return "Moved to channel " + cname;
	}

	cchan(cname: string, newowner: string, pass: string): string {
		const chan = ChanManager.instance.findByName(cname);
		if (chan)
			throw "Channel already exists"

		ChanManager.instance.create(cname, newowner, { passwd: pass });
		return "Channel " + cname + " has been created";
	}

	dchan(cname: string, uname: string): string {
		const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel";
		if (chan.checkowner(uname) == false)
			throw "You are not the owner of this channel";
		for (let index = 0; index < chan.users.length; index++) {
			this.join("general", chan.users[index]);
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

	checkban(cname: string, uname: string): string {
		const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel"
		let dur = chan.checkban(uname);
		if (dur > 0)
			dur /= 1000;
		return dur.toString();
	}

	ban(cname: string, uname: string, duration: number = 0): string {
		const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			 throw "Can't find channel";
		chan.banUser(uname, duration * 1000);
		if (duration == 0)
			return "Banned user " + uname + " from channel " + cname;
		else
			return "Muted user " + uname + " from channel " + cname + " for " + duration + " seconds";
	}

	unban(cname: string, uname: string): string {
		const chan = ChanManager.instance.findByName(cname);
		if (!chan)
			throw "Can't find channel"
		chan.unbanUser(uname);
		return "Unbanned user " + uname + " from channel " + cname;
	}
}
