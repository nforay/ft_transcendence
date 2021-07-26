import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('text') name: string;
  @Column('text') email: string;
  @Column('text') password: string;
  @Column('text') role: string;
  @Column('text') bio: string;

  @CreateDateColumn() created: Date;
}
