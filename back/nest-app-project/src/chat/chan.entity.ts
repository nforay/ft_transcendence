import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ChanEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'text', unique: true })
	name: string;

	@Column({ type: 'text' })
	owner: string;

	@Column("text", { default: [] })
	admins: string[];

	@Column("text", { default: [] })
	users: string[];

	// @Column("text", { default: new Map<string, [number, number]>() })
	// bans: Map<string, [number, number]>;

	@Column("text", { default: [] })
	bansID: string[];

	@Column("text", { default: [] })
	bansST: number[];

	@Column("text", { default: [] })
	bansTS: number[];
	// String is the name, number is the ban
	// status, 0 is not banned, -1 is banned
	// and any other number is the timestamp
	// of the mute, the second number is the
	// duration

	@Column({ type: 'text', default: "private" })
	type: string;

	@Column({ type: 'text', default: null })
	passwd: string;

	addUser(uname: string, pwd: string = null): boolean {
		if (pwd != this.passwd)
			return false;
		if (this.users.indexOf(uname) == -1) {
			this.users.push(uname);
			console.log("ADDED USER TO CHANNEL " + this.name + " DATABASE");
		}
		else {
			console.log("USER ALREADY EXISTS IN CHANNEL " + this.name + " DATABASE");
		}
		return true;
	}

	rmUser(uname: string) {
		let i = this.users.indexOf(uname);
		if (i != -1)
			this.users.splice(i);
		let id = this.bansID.indexOf(uname);
		if (id != -1) {
			if (this.bansST[id] == 0) {
				this.bansID.splice(id);
				this.bansST.splice(id);
				this.bansTS.splice(id);
			}
			else if (this.bansST[id] > 0) {
				let now = new Date();
				if (now.getTime() >= (this.bansST[id] + this.bansTS[id])) {
					this.bansID.splice(id);
					this.bansST.splice(id);
					this.bansTS.splice(id);
				}
			}
		}
	}

	checkban(uname: string): number {
		let id = this.bansID.indexOf(uname);
		if (id != -1) {
			if (this.bansST[id] == 0) {
				this.bansID.splice(id);
				this.bansST.splice(id);
				this.bansTS.splice(id);
				return 0;
			}
			else if (this.bansST[id] > 0) {
				let now = new Date();
				if (now.getTime() >= (this.bansST[id] + this.bansTS[id])) {
					this.bansID.splice(id);
					this.bansST.splice(id);
					this.bansTS.splice(id);
					return 0;
				}
				else {
					let now = new Date();
					return (this.bansST[id] + this.bansTS[id]) - now.getTime();
				}
			}
			else
				return -1;
		}
		return 0;
	}

	banUser(uname: string, duration: number = 0) {
		if (duration == 0) {
			this.bansID.push(uname);
			this.bansST.push(-1);
			this.bansTS.push(0);
		}
		else {
			let now = new Date();
			this.bansID.push(uname);
			this.bansST.push(now.getTime());
			this.bansTS.push(duration);
		}
	}

	unbanUser(uname: string) {
		let id = this.bansID.indexOf(uname);
		if (id != -1) {
			this.bansID.splice(id);
			this.bansST.splice(id);
			this.bansTS.splice(id);
		}
	}
}
