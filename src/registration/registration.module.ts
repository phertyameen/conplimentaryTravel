import { Module } from '@nestjs/common';
import { RegistrationController } from './registration.controller';
import { RegistrationService } from './registration.service';
import { UploadModule } from 'src/upload/upload.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationEntity } from './entities/registration.entity';
import { TravelerEntity } from './entities/traveler.entity';
import { StorageModule } from 'src/storage/storage.module';
import { MailModule } from 'src/mail/mail.module';
import { ExportModule } from 'src/export/export.module';

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
