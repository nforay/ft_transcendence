import { Injectable } from '@nestjs/common';
import { ChanEntity } from './chan.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ChanService {
	constructor(@InjectRepository(ChanEntity) private chanRepo: Repository<ChanEntity>) {
		this.cchan("general", "");
	}

	async getUsers(cname: string): Promise<string[]> {
		let chan = await this.chanRepo.findOne({ where: { cname } });
		if (!chan)
			return Promise.reject(["Can't find channel"]);
		return Promise.resolve(chan.users);
	}

	async leave(cname: string, uname: string): Promise<string> {
		let chan = await this.chanRepo.findOne({ where: { cname } });
		if (!chan)
			return Promise.reject("Can't find channel");
		chan.rmUser(uname);
		return Promise.resolve("Left channel " + cname);
	}

	async join(cname: string, uname: string, pwd: string = ""): Promise<string> {
		let chan = await this.chanRepo.findOne({ where: { cname } });
		if (!chan)
			return Promise.reject("Can't find channel");
		if (chan.addUser(uname, pwd) == false)
			return Promise.resolve("Wrong password");
		return Promise.resolve("Moved to channel " + cname);
	}

	async cchan(newName: string, newOwner: string): Promise<string> {
		let chan = await this.chanRepo.findOne({ where: { newName } });
		if (chan)
			return Promise.reject("Chan already exists");

		const newchan = this.chanRepo.create({
			name: newName,
			owner: newOwner
		});
		await this.chanRepo.save(newchan);
		return Promise.resolve("Channel " + newName + " has been created");
	}

	async dchan(cname: string): Promise<string> {
		const chan = await this.chanRepo.findOne({ where: { cname } });
		if (!chan)
			return Promise.reject("Can't find channel");
		for (let index = 0; index < chan.users.length; index++) {
			this.join(chan.users[index], "general");
		}
		await this.chanRepo.delete(chan);
		return Promise.resolve("Channel " + cname + " has been deleted");
	}

	async checkban(cname: string, uname: string): Promise<string> {
		let chan = await this.chanRepo.findOne({ where: { cname } });
		if (!chan)
			return Promise.reject("Can't find channel");
		return Promise.resolve(chan.checkban(uname) + "");
	}

	async ban(cname: string, uname: string, duration: number = 0): Promise<string> {
		let chan = await this.chanRepo.findOne({ where: { cname } });
		if (!chan)
			return Promise.reject("Can't find channel");
		chan.banUser(uname, duration * 1000);
		if (duration == 0)
			return Promise.resolve("Banned user " + uname + " from channel " + cname);
		else
			return Promise.resolve("Muted user " + uname + " from channel " + cname + " for " + duration + " seconds");
	}

	async unban(cname: string, uname: string): Promise<string> {
		let chan = await this.chanRepo.findOne({ where: { cname } });
		if (!chan)
			return Promise.reject("Can't find channel");
		chan.unbanUser(uname);
		return Promise.resolve("Unbanned user " + uname + " from channel " + cname);
	}
}
