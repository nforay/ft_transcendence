import { Injectable } from '@nestjs/common';
import { ChanEntity } from './chan.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ChanService {
	constructor(@InjectRepository(ChanEntity) private chanRepo: Repository<ChanEntity>) {
		this.cchan("general", "");
	}

	async getUsers(name: string): Promise<string[]> {
		let chan = await this.chanRepo.findOne({ where: { name } });
		console.log("CHAN ENTITY");
		console.log(chan.name);
		if (!chan)
			return Promise.reject(["Can't find channel"]);
		return Promise.resolve(chan.users);
	}

	async leave(name: string, uname: string): Promise<string> {
		let chan = await this.chanRepo.findOne({ where: { name } });
		if (!chan)
			return Promise.reject("Can't find channel");
		chan.rmUser(uname);
		return Promise.resolve("Left channel " + name);
	}

	async join(name: string, uname: string, pwd: string = null): Promise<string> {
		let chan = await this.chanRepo.findOne({ where: { name } });
		if (!chan)
			return Promise.reject("Can't find channel");
		if (chan.addUser(uname, pwd) == false)
			return Promise.reject("Wrong password");
		return Promise.resolve("Moved to channel " + name);
	}

	async cchan(name: string, owner: string): Promise<string> {
		let chan = await this.chanRepo.findOne({ where: { name } });
		if (chan)
			return Promise.reject("Chan already exists");

		const newchan = this.chanRepo.create({
			name: name,
			owner: owner
		});
		await this.chanRepo.save(newchan);
		return Promise.resolve("Channel " + name + " has been created");
	}

	async dchan(name: string): Promise<string> {
		const chan = await this.chanRepo.findOne({ where: { name } });
		if (!chan)
			return Promise.reject("Can't find channel");
		for (let index = 0; index < chan.users.length; index++) {
			this.join(chan.users[index], "general");
		}
		await this.chanRepo.delete(chan);
		return Promise.resolve("Channel " + name + " has been deleted");
	}

	async checkban(name: string, uname: string): Promise<string> {
		let chan = await this.chanRepo.findOne({ where: { name } });
		if (!chan)
			return Promise.reject("Can't find channel");
		return Promise.resolve(chan.checkban(uname) + "");
	}

	async ban(name: string, uname: string, duration: number = 0): Promise<string> {
		let chan = await this.chanRepo.findOne({ where: { name } });
		if (!chan)
			return Promise.reject("Can't find channel");
		chan.banUser(uname, duration * 1000);
		if (duration == 0)
			return Promise.resolve("Banned user " + uname + " from channel " + name);
		else
			return Promise.resolve("Muted user " + uname + " from channel " + name + " for " + duration + " seconds");
	}

	async unban(name: string, uname: string): Promise<string> {
		let chan = await this.chanRepo.findOne({ where: { name } });
		if (!chan)
			return Promise.reject("Can't find channel");
		chan.unbanUser(uname);
		return Promise.resolve("Unbanned user " + uname + " from channel " + name);
	}
}
