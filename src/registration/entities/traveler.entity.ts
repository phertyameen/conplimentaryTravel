import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RegistrationEntity } from './registration.entity';

@Entity('travelers')
export class TravelerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => RegistrationEntity,
    (registration) => registration.travelers,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'registration_id' })
  registration: RegistrationEntity;

  // 0 = primary traveler, 1–2 = additional travelers
  @Column({ name: 'traveler_index', type: 'int' })
  travelerIndex: number;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 50 })
  phone: string;

  @Column({ name: 'residential_address', type: 'nvarchar', length: 500 })
  residentialAddress: string;

  // Stored as JSON array e.g. ["France", "Germany"]
  @Column({ type: 'nvarchar', length: 1000 })
  destinations: string;

  @Column({ name: 'departure_date', type: 'date' })
  departureDate: string;

  @Column({ name: 'return_date', type: 'date' })
  returnDate: string;

  // Base Azure Blob URL (no SAS) stored in DB
  // Use StorageService.generateSasUrl(blobName) to get a viewable link
  @Column({ name: 'passport_file_url', type: 'nvarchar', length: 1000 })
  passportFileUrl: string;

  // Blob name used to generate SAS tokens on demand
  // e.g. "John_Doe_a1b2c3d4.pdf"
  @Column({ name: 'passport_blob_name', type: 'nvarchar', length: 500 })
  passportBlobName: string;

  // Original filename uploaded by the user
  @Column({ name: 'passport_file_name', length: 255 })
  passportFileName: string;
}
