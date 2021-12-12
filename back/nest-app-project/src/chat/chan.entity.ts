import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ChanEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'text', unique: true })
	name: string;

	@Column({ type: 'text' })
	owner: string;

	@Column("text", { default: [], array: true })
	admins: string[];

	@Column("text", { default: [], array: true })
	users: string[];

	// @Column("text", { default: new Map<string, [number, number]>() })
	// bans: Map<string, [number, number]>;

	@Column("text", { default: [], array: true })
	bansID: string[];

	@Column("text", { default: [], array: true })
	bansST: number[];

	@Column("text", { default: [], array: true })
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
			console.log(this.users);
		}
		else {
			console.log("USER ALREADY EXISTS IN CHANNEL " + this.name + " DATABASE");
		}
		return true;
	}

	rmUser(uname: string) {
		let i = this.users.indexOf(uname);
		if (i != -1)
			this.users.splice(i, 1);
		let id = this.bansID.indexOf(uname);
		if (id != -1) {
			if (this.bansST[id] == 0) {
				this.bansID.splice(id, 1);
				this.bansST.splice(id, 1);
				this.bansTS.splice(id, 1);
			}
			else if (this.bansST[id] > 0) {
				let now = new Date();
				if (+now.getTime() >= (+this.bansST[id] + +this.bansTS[id])) {
					this.bansID.splice(id, 1);
					this.bansST.splice(id, 1);
					this.bansTS.splice(id, 1);
				}
			}
		}
	}

	settype(uname: string, newtype: string): boolean {
		if (uname != this.owner)
			return false;
		this.type = newtype;
		return true;
	}

	checkowner(uname: string): boolean {
		if (uname == this.owner)
			return true;
		return false;
	}

	checkadmin(uname: string): boolean {
		return this.checkowner(uname) || this.admins.indexOf(uname) != -1
	}

	op(uname: string, newop: string = null): string {
		if (newop == null)
			return this.admins.toString();
		if (uname != this.owner)
			return "You are not the owner of this channel";
		let a = this.admins.indexOf(newop);
		if (a == -1) {
			this.admins.push(newop);
			return "User " + newop + " is now an operator";
		}
		else {
			this.admins.splice(a, 1);
			return "User " + newop + " is not an operator anymore";
		}
	}

	checkban(uname: string): number {
		let id = this.bansID.indexOf(uname);
		if (id != -1) {
			if (this.bansST[id] == 0) {
				this.bansID.splice(id, 1);
				this.bansST.splice(id, 1);
				this.bansTS.splice(id, 1);
				return 0;
			}
			else if (this.bansST[id] > 0) {
				let now = new Date();
				if (+now.getTime() >= (+this.bansST[id] + +this.bansTS[id])) {
					this.bansID.splice(id, 1);
					this.bansST.splice(id, 1);
					this.bansTS.splice(id, 1);
					return 0;
				}
				else {
					return (+this.bansST[id] + +this.bansTS[id]) - +now.getTime();
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
			console.log("uname = " + uname + " now.getTime() = " + now.getTime() + " duration = " + duration)
			this.bansID.push(uname);
			this.bansST.push(now.getTime());
			this.bansTS.push(duration);
		}
	}

	unbanUser(uname: string) {
		let id = this.bansID.indexOf(uname);
		if (id != -1) {
			this.bansID.splice(id, 1);
			this.bansST.splice(id, 1);
			this.bansTS.splice(id, 1);
		}
	}
}
