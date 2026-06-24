import { Module } from '@nestjs/common';
import { RegistrationController } from './registration.controller';
import { RegistrationService } from './registration.service';
import { UploadModule } from '../upload/upload.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationEntity } from './entities/registration.entity';
import { TravelerEntity } from './entities/traveler.entity';
import { StorageModule } from '../storage/storage.module';
import { MailModule } from '../mail/mail.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RegistrationEntity, TravelerEntity]),
    UploadModule,
    StorageModule,
    MailModule,
    ExportModule,
  ],
  controllers: [RegistrationController],
  providers: [RegistrationService],
})
export class RegistrationModule {}
