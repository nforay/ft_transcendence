import { Injectable } from '@nestjs/common';
import { ChanEntity } from './chan.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ChanService {
	constructor(@InjectRepository(ChanEntity) private chanRepo: Repository<ChanEntity>) {
		; //! Ajouter général si il n'existe pas
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

	async dchan(name: string) { //! Bouger tous les utilisateurs
		const chan = await this.chanRepo.findOne({ where: { name } });
		if (!chan)
			return Promise.reject("Can't find channel " + name);
		await this.chanRepo.delete(chan);
		return Promise.resolve("Channel " + name + " has been deleted");
	}
}
