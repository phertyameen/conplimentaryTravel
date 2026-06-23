import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

/**
 * StorageService is the single abstraction layer for file persistence.
 *
 * Currently implemented as local disk storage.
 * To switch to Azure Blob, AWS S3, or GCS — replace only the `save` method body.
 * All callers (UploadService) remain unchanged.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.uploadDir = this.config.get<string>('appConfig.uploadDir') || './uploads/passports';
    this.baseUrl = this.config.get<string>('appConfig.baseUrl') || 'http://localhost:3001';
  }

  /**
   * Saves a file to storage and returns its publicly accessible URL.
   */
  async save(file: Express.Multer.File): Promise<string> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });

      const ext = path.extname(file.originalname);
      const uniqueFileName = `${uuidv4()}${ext}`;
      const filePath = path.join(this.uploadDir, uniqueFileName);

      await fs.writeFile(filePath, file.buffer);

      return `${this.baseUrl}/uploads/passports/${uniqueFileName}`;
    } catch (error) {
      this.logger.error('Failed to save file to storage', error);
      throw new InternalServerErrorException('File could not be saved. Please try again.');
    }
  }

  /**
   * Deletes a file by URL (used for cleanup on failed submissions).
   */
  async delete(fileUrl: string): Promise<void> {
    try {
      const fileName = path.basename(fileUrl);
      const filePath = path.join(this.uploadDir, fileName);
      await fs.unlink(filePath);
    } catch (error) {
      this.logger.warn(`Could not delete file: ${fileUrl}`, error);
    }
  }
}