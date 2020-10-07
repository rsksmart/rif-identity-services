import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity()
export class IpfsSavedContent {
  constructor (did: string, key: string, cid: string) {
    this.did = did
    this.key = key
    this.cid = cid
  }

  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  did!: string;

  @Column('text')
  key!: string;

  @Column('text')
  cid!: string;
}

@Entity()
export class IpfsPinnedCid {
  constructor (cid: string) {
    this.cid = cid
  }

  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  cid!: string;
}

export const Entities = [IpfsPinnedCid, IpfsSavedContent]
