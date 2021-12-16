import { UserManager } from 'src/user/user.model';

export class ChanEntity {
	name: string;

	owner: string;

	admins: string[] = [];

	users: string[] = [];

	// @Column("text", { default: new Map<string, [number, number]>() })
	// bans: Map<string, [number, number]>;

	bansID: string[] = [];

	bansST: number[] = [];

	bansTS: number[] = [];
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
    if (args.bansID)
      this.bansID = args.bansID;
    if (args.bansST)
      this.bansST = args.bansST;
    if (args.bansTS)
      this.bansTS = args.bansTS;
    if (args.type)
      this.type = args.type;
    if (args.passwd)
      this.passwd = args.passwd;
  }

	addUser(uname: string, pwd: string = null): boolean {
		if (pwd != this.passwd)
			return false;
		if (this.users.indexOf(uname) == -1)
			this.users.push(uname);
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

	async checkadmin(uname: string): Promise<boolean> {
    const user = await UserManager.instance.userRepository.findOne({ id: uname });
    if (user == null)
      return false;
		return this.checkowner(uname) || this.admins.indexOf(uname) != -1 || user.role === 'admin';
	}

	async op(uname: string, newop: string = null): Promise<string> {
    
    if (newop == null) {
      let where = this.admins.map(x => { return { id: x }});
      where.push({id: this.owner });
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
