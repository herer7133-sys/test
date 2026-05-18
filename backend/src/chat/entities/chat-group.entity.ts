import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { ChatMessage } from './chat-message.entity';
import { ChatGroupType } from '../dto/chat.dto';

@Entity('chat_groups')
export class ChatGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ChatGroupType,
    default: ChatGroupType.GROUP,
  })
  type: ChatGroupType;

  @Column({ nullable: true })
  partyId: string;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ name: 'created_by_id' })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ChatMessage, (message) => message.group)
  messages: ChatMessage[];

  @ManyToMany(() => User)
  members: User[];
}
