import { Logger } from '@nestjs/common';
import { UserManager } from 'src/user/user.model';

export class BanData {
  public id: string;
  public until: number = -1;
  public reason: string = "";

  fromArray(array: string[]) : BanData {
    this.id = array[0];
    this.reason = array[1];
    this.until = parseInt(array[2]);
    return this;
  }

  toArray() : string[] {
    return [ this.id, this.reason, this.until.toString() ];
  }

  constructor(user: string, reason?: string, duration?: number) {
    this.id = user;
    if (duration)
      this.until = new Date().getTime() + (duration * 1000);
    this.reason = reason ? reason : "The ban hammer has spoken!";
  }

  expired() : boolean {
    return this.until != -1 && this.until < new Date().getTime();
  }

  getFormattedTime(): string {
    let diff = this.until - new Date().getTime();
    if (diff < 0) {
      return "permanently";
    }
    else {
      let days = Math.floor(diff / (1000 * 60 * 60 * 24));
      let hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      let seconds = Math.ceil((diff % (1000 * 60)) / 1000);
      return "for " + (days > 0 ? `${days} day(s)` : hours > 0 ? `${hours} hour(s)` : minutes > 0 ? `${minutes} minute(s)` : `${seconds} second(s)`);
    }
  }
}

export class ChanEntity {
	name: string;

	owner: string;

	admins: string[] = [];

	users: string[] = [];

	bans: Map<string, BanData> = new Map<string, BanData>();
  mutes: Map<string, BanData> = new Map<string, BanData>();

	// String is the name, number is the ban
	// status, 0 is not banned, -1 is banned
	// and any other number is the timestamp
	// of the mute, the second number is the
	// duration

	type: string = "private";

	passwd: string = null;

  constructor(name: string, owner: string, args?: any) {
    this.name = name;
    this.owner = owner;

    if (!args)
      return;

    if (args.admins)
      this.admins = args.admins;
    if (args.users)
      this.users = args.users;
    if (args.bans)
      this.bans = args.bans;
    if (args.mutes)
      this.mutes = args.mutes;
    if (args.type)
      this.type = args.type;
    if (args.passwd)
      this.passwd = args.passwd;
  }

	addUser(uname: string, pwd: string = null): void {
		if (this.users.indexOf(uname) == -1)
			this.users.push(uname);
	}

	rmUser(uname: string) {
		let i = this.users.indexOf(uname);
		if (i != -1)
			this.users.splice(i, 1);
	}

	settype(uname: string, newtype: string): boolean {
		if (uname != this.owner)
			return false;
		this.type = newtype;
		return true;
	}

	checkowner(uname: string): boolean {
		return uname == this.owner
	}

	async checkadmin(uname: string): Promise<boolean> {
    const user = await UserManager.instance.userRepository.findOne({ id: uname });
    if (!user)
      return false;
		return this.checkowner(uname) || this.admins.indexOf(uname) != -1 || user.role === 'admin';
	}

	async op(uname: string, newop: string = null): Promise<string> {
    
    if (newop == null) {
      let where = this.admins.map(x => { return { id: x }});
      if (this.owner.length > 0)
        where.push({id: this.owner });
      if (where.length == 0)
        return "No operators found";
      const users = await UserManager.instance.userRepository.find({where});
      if (!users)
        return "No operators found";
      let msg = "Operators : ";
      msg += users[0].name
      for (let i = 1; i < users.length; i++) {
        msg += ", " + users[i].name;
      }
      return msg;
    }

		if (uname != this.owner)
			return "You are not the owner of this channel";
    const user = await UserManager.instance.userRepository.findOne({ where: { name: newop }});
    if (!user)
      return "User not found";
		let a = this.admins.indexOf(user.id);
		if (a == -1) {
			this.admins.push(user.id);
			return "User " + newop + " is now an operator";
		}
		else {
			this.admins.splice(a, 1);
			return "User " + newop + " is not an operator anymore";
		}
	}

	async checkban(uname: string): Promise<BanData> {
    const user = await UserManager.instance.userRepository.findOne({ id: uname });
    if (!user)
      return null;
    const chatBan = user.checkban();
    if (chatBan)
      return chatBan;
		if (this.bans.has(uname))
      return this.bans.get(uname);
    return null;
	}

  async checkmute(uname: string): Promise<BanData> {
    const user = await UserManager.instance.userRepository.findOne({ id: uname });
    if (!user)
      return null;
    const chatMute = user.checkmute();
    if (chatMute)
      return chatMute;
		if (this.mutes.has(uname))
      return this.mutes.get(uname);
    return null;
	}

  async banUser(uname: string, reason?: string, duration?: number) : Promise<BanData> {
    if (this.name === "general") {
      const user = await UserManager.instance.userRepository.findOne({ id: uname });
      const banData = user.banUser(reason, duration);
      await UserManager.instance.userRepository.save(user);
      return banData;
    }
    this.bans.set(uname, new BanData(uname, reason, duration));
    return this.bans.get(uname);
  }

  async unbanUser(uname: string) {
    if (this.name === "general") {
      const user = await UserManager.instance.userRepository.findOne({ id: uname });
      const banData = user.unbanUser();
      await UserManager.instance.userRepository.save(user);
      return banData;
    }
    this.bans.delete(uname);
  }

  async muteUser(uname: string, reason?: string, duration?: number) : Promise<BanData> {
    if (this.name === "general") {
      const user = await UserManager.instance.userRepository.findOne({ id: uname });
      const banData = user.muteUser(reason, duration);
      await UserManager.instance.userRepository.save(user);
      return banData;
    }
    this.mutes.set(uname, new BanData(uname, reason, duration));
    return this.mutes.get(uname);
  }

	async unmuteUser(uname: string) {
    if (this.name === "general") {
      const user = await UserManager.instance.userRepository.findOne({ id: uname });
      const banData = user.unmuteUser();
      await UserManager.instance.userRepository.save(user);
      return banData;
    }
    this.mutes.delete(uname);
	}

}
