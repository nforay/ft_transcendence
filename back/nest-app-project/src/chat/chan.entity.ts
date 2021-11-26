import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ChanEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'text', unique: true })
	name: string;

	@Column({ type: 'text' })
	owner: string;

	@Column({ default: [] })
	admins: Array<string>;

	@Column({ default: new Map<string, [number, number]>() })
	users: Map<string, [number, number]>;
	// String is the name, number is the ban
	// status, 0 is not banned, -1 is banned
	// and any other number is the timestamp
	// of the mute, the second number is the
	// duration

	@Column({ type: 'text', default: "private" })
	type: string;

	@Column({ type: 'text', default: null })
	passwd: string;

	getUsers(): Map<string, [number, number]> {
		return this.users;
	}
}
