import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { TravelerEntity } from './traveler.entity';

@Entity('registrations')
export class RegistrationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reference_number', unique: true, length: 20 })
  referenceNumber: string; // CTS-[YYYYMMDD]-[XXXX]

  // SECTION 1: COOPERATOR

  @Column({ name: 'cooperator_full_name', length: 255 })
  cooperatorFullName: string;

  @Column({ name: 'cooperator_email', length: 255 })
  cooperatorEmail: string;

  @Column({ name: 'cooperator_scheme_name' })
  cooperatorSchemeName: string;

  // SECTION 2: TRAVELERS

  @OneToMany(() => TravelerEntity, (traveler) => traveler.registration, {
    cascade: true,
    eager: true,
  })
  travelers: TravelerEntity[];

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;
}