import { Entity, Column, BaseEntity, OneToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm'
import { Message } from '@veramo/data-store'

@Entity()
export default class CredentialRequest extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  hash: string

  @Column()
  status: string

  // @Column("text")
  // failureReason: string

  @OneToOne(type => Message)
  @JoinColumn()
  message: Message;
}
