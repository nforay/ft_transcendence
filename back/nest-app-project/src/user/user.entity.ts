import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BeforeInsert } from 'typeorm';
import * as bcrypt from 'bcryptjs'

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @CreateDateColumn() created: Date;

  @Column({ type: 'text', unique: true }) name: string;
  @Column('text') email: string;
  @Column('text') role: string;
  @Column('text') bio: string;
  @Column('text') password: string;

  @BeforeInsert()
  private async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
