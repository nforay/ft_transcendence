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

	@Column("text", { default: new Map<string, [number, number]>() })
	bans: Map<string, [number, number]>;
	// String is the name, number is the ban
	// status, 0 is not banned, -1 is banned
	// and any other number is the timestamp
	// of the mute, the second number is the
	// duration

	@Column({ type: 'text', default: "private" })
	type: string;

	@Column({ type: 'text', default: null })
	passwd: string;

	addUser(uname: string, pwd: string = ""): boolean {
		if (pwd != this.passwd)
			return false;
		if (this.users.indexOf(uname) != -1)
			this.users.push(uname);
		return true;
	}

	rmUser(uname: string) {
		let i = this.users.indexOf(uname);
		if (i != -1)
			this.users.splice(i);
		if (this.bans.has(uname)) {
			if (this.bans.get(uname)[0] == 0)
				this.bans.delete(uname);
			else if (this.bans.get(uname)[0] > 0) {
				let now = new Date();
				if (now.getTime() >= (this.bans.get(uname)[0] + this.bans.get(uname)[1]))
					this.bans.delete(uname);
			}
		}
	}

	checkban(uname: string): number {
		if (this.bans.has(uname)) {
			if (this.bans.get(uname)[0] == 0) {
				this.bans.delete(uname);
				return 0;
			}
			else if (this.bans.get(uname)[0] > 0) {
				let now = new Date();
				if (now.getTime() >= (this.bans.get(uname)[0] + this.bans.get(uname)[1])) {
					this.bans.delete(uname);
					return 0;
				}
				else {
					let now = new Date();
					return (this.bans.get(uname)[0] + this.bans.get(uname)[1]) - now.getTime();
				}
			}
			else
				return -1;
		}
		return 0;
	}

	banUser(uname: string, duration: number = 0) {
		if (duration == 0)
			this.bans.set(uname, [-1, 0]);
		else {
			let now = new Date();
			this.bans.set(uname, [now.getTime(), duration]);
		}
	}

	unbanUser(uname: string) {
		if (this.bans.has(uname))
			this.bans.delete(uname);
	}
}
