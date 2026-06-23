import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [
    StorageModule,
    MulterModule.register({
      storage: memoryStorage(), // Keep in memory; StorageService handles persistence
    }),
  ],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}