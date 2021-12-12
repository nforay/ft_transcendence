import { Injectable } from '@nestjs/common';
import { ChanEntity } from './chan.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ChanService {
	public promIni: Promise<boolean>;

	constructor(@InjectRepository(ChanEntity) private chanRepo: Repository<ChanEntity>) {
		this.promIni = new Promise<boolean>((resolve) => {
			this.chanRepo.findOne({ where: { name: "general" } }).then((chan) => {
				if (chan) {
					resolve(true);
					return;
				}
				const newchan = this.chanRepo.create({
					name: "general",
					owner: "",
					type: "public"
				});
				this.chanRepo.save(newchan).finally(() => {
					resolve(true);
				});
			}).catch(() => {
				const newchan = this.chanRepo.create({
					name: "general",
					owner: "",
					type: "public"
				});
				this.chanRepo.save(newchan).finally(() => {
					resolve(true);
				});
			});
		});
	}

	async getPublicChannels(): Promise<string[]> {
		let chans = await this.chanRepo.find({ where: { type: "public" } });
		if (!chans || chans.length == 0)
			return Promise.resolve(["There is no channels"]);
		let ret: string[] = new Array<string>();
		for (let key = 0; key < chans.length; key++) {
			ret.push(chans[key].name);
		}
		return Promise.resolve(ret);
	}

	async getUsers(cname: string): Promise<string[]> {
		let chan = await this.chanRepo.findOne({ where: { name: cname } });
		if (!chan)
			return Promise.reject(["Can't find channel"]);
		console.log("users in chan " + cname + " are " + chan.users + ".");
		return Promise.resolve(chan.users);
	}

	async op(cname: string, uname: string, newop: string = null): Promise<string> {
		let chan = await this.chanRepo.findOne({ where: { name: cname } });
		if (!chan)
			return Promise.reject("Can't find channel");
		let ret = chan.op(uname, newop);
		await this.chanRepo.save(chan);
		return Promise.resolve(ret);
	}

	async checkadmin(cname: string, uname: string): Promise<boolean> {
		let chan = await this.chanRepo.findOne({ where: { name: cname } });
		if (!chan)
			return Promise.reject(false);
		let ret = chan.checkadmin(uname);
		console.log("cname = " + cname + " uname = " + uname + " ret = " + ret);
		return Promise.resolve(ret);
	}

	async leave(cname: string, uname: string): Promise<string> {
		let chan = await this.chanRepo.findOne({ where: { name: cname } });
		if (!chan)
			return Promise.reject("Can't find channel");
		chan.rmUser(uname);
		await this.chanRepo.save(chan);
		return Promise.resolve("Left channel " + cname);
	}

	async join(cname: string, uname: string, pwd: string = null): Promise<string> {
		let chan = await this.chanRepo.findOne({ where: { name: cname } });
		if (!chan)
			return Promise.reject("Can't find channel");
		if (chan.addUser(uname, pwd) == false)
			return Promise.reject("Wrong password");
		await this.chanRepo.save(chan);
		return Promise.resolve("Moved to channel " + cname);
	}

	async cchan(cname: string, newowner: string): Promise<string> {
		let chan = await this.chanRepo.findOne({ where: { name: cname } });
		if (chan)
			return Promise.reject("Chan already exists");

		const newchan = this.chanRepo.create({
			name: cname,
			owner: newowner
		});
		await this.chanRepo.save(newchan);
		return Promise.resolve("Channel " + cname + " has been created");
	}

	async dchan(cname: string, uname: string): Promise<string> {
		const chan = await this.chanRepo.findOne({ where: { name: cname } });
		if (!chan)
			return Promise.reject("Can't find channel");
		if (chan.checkowner(uname) == false)
			return Promise.reject("You are not the owner of this channel");
		for (let index = 0; index < chan.users.length; index++) {
			this.join("general", chan.users[index]);
		}
		await this.chanRepo.delete(chan);
		return Promise.resolve("Channel " + cname + " has been deleted");
	}

	async setpublic(cname: string, uname: string) {
		const chan = await this.chanRepo.findOne({ where: { name: cname } });
		if (!chan)
			return Promise.reject("Can't find channel");
		if (chan.settype(uname, "public") == false)
			return Promise.reject("You are not the owner of this channel");
		await this.chanRepo.save(chan);
		return Promise.resolve("Channel " + cname + " set to public");
	}

	async setprivate(cname: string, uname: string) {
		const chan = await this.chanRepo.findOne({ where: { name: cname } });
		if (!chan)
			return Promise.reject("Can't find channel");
		if (chan.settype(uname, "private") == false)
			return Promise.reject("You are not the owner of this channel");
		await this.chanRepo.save(chan);
		return Promise.resolve("Channel " + cname + " set to private");
	}

	async checkban(cname: string, uname: string): Promise<string> {
		let chan = await this.chanRepo.findOne({ where: { name: cname } });
		if (!chan)
			return Promise.reject("Can't find channel");
		let dur = chan.checkban(uname);
		if (dur > 0)
			dur /= 1000;
		return Promise.resolve(dur.toString());
	}

	async ban(cname: string, uname: string, duration: number = 0): Promise<string> {
		let chan = await this.chanRepo.findOne({ where: { name: cname } });
		if (!chan)
			return Promise.reject("Can't find channel");
		chan.banUser(uname, duration * 1000);
		await this.chanRepo.save(chan);
		if (duration == 0)
			return Promise.resolve("Banned user " + uname + " from channel " + cname);
		else
			return Promise.resolve("Muted user " + uname + " from channel " + cname + " for " + duration + " seconds");
	}

	async unban(cname: string, uname: string): Promise<string> {
		let chan = await this.chanRepo.findOne({ where: { name: cname } });
		if (!chan)
			return Promise.reject("Can't find channel");
		chan.unbanUser(uname);
		await this.chanRepo.save(chan);
		return Promise.resolve("Unbanned user " + uname + " from channel " + cname);
	}
}
