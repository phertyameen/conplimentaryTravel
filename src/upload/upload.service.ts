import { Injectable, BadRequestException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';

// Requirement: Images (JPG, PNG) and PDF only
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export interface StoredFile {
  blobUrl: string;   // base Azure URL (stored in DB)
  blobName: string;  // blob name (used to generate SAS URLs on demand)
  fileName: string;  // original filename
}

@Injectable()
export class UploadService {
  constructor(private readonly storageService: StorageService) {}

  /**
   * Validates a single file then uploads to Azure Blob.
   * Blob is named using the traveler's full name for easy identification.
   */
  async validateAndStore(
    file: Express.Multer.File,
    travelerIndex: number,
    travelerFullName: string,
  ): Promise<StoredFile> {
    this.validateMimeType(file, travelerIndex);
    this.validateExtension(file, travelerIndex);
    this.validateFileSize(file, travelerIndex);

    const { blobUrl, blobName } = await this.storageService.save(
      file,
      travelerFullName,
    );

    return { blobUrl, blobName, fileName: file.originalname };
  }

  /**
   * Validates and uploads all passport files.
   * travelerNames must be in the same order as files.
   */
  async validateAndStoreMany(
    files: Express.Multer.File[],
    travelerNames: string[],
  ): Promise<StoredFile[]> {
    return Promise.all(
      files.map((file, index) =>
        this.validateAndStore(file, index, travelerNames[index]),
      ),
    );
  }

  // Private Helpers

  private validateMimeType(file: Express.Multer.File, index: number): void {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Traveler ${index + 1} passport: only PDF, JPG, or PNG files are accepted. Received MIME type: ${file.mimetype}`,
      );
    }
  }

  private validateExtension(file: Express.Multer.File, index: number): void {
    const ext = file.originalname
      .substring(file.originalname.lastIndexOf('.'))
      .toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `Traveler ${index + 1} passport: only .pdf, .jpg, .jpeg, .png extensions are accepted. Received: ${ext}`,
      );
    }
  }

  private validateFileSize(file: Express.Multer.File, index: number): void {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `Traveler ${index + 1} passport exceeds the 10MB size limit. Received: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      );
    }
  }
}