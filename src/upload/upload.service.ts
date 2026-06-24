import { Injectable, BadRequestException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

@Injectable()
export class UploadService {
  constructor(private readonly storageService: StorageService) {}

  /**
   * Validates a single file then uploads it to Azure Blob Storage.
   * Returns the blob URL and original filename.
   */
  async validateAndStore(
    file: Express.Multer.File,
    travelerIndex: number,
  ): Promise<{ url: string; fileName: string }> {
    this.validateMimeType(file, travelerIndex);
    this.validateFileSize(file, travelerIndex);

    const url = await this.storageService.save(file);
    return { url, fileName: file.originalname };
  }

  /**
   * Validates and uploads all passport files to Azure Blob Storage.
   * files[0] → primary traveler, files[1-2] → additional travelers.
   * Returns array of { url, fileName } in the same order.
   */
  async validateAndStoreMany(
    files: Express.Multer.File[],
  ): Promise<Array<{ url: string; fileName: string }>> {
    return Promise.all(
      files.map((file, index) => this.validateAndStore(file, index)),
    );
  }

  /**
   * Validates files only — no upload.
   * Used for pre-flight checks before any storage operation.
   */
  validateMany(files: Express.Multer.File[]): void {
    files.forEach((file, index) => {
      this.validateMimeType(file, index);
      this.validateFileSize(file, index);
    });
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private validateMimeType(file: Express.Multer.File, index: number): void {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Traveler ${index + 1} passport file must be a PDF, JPG, or PNG. Received: ${file.mimetype}`,
      );
    }
  }

  private validateFileSize(file: Express.Multer.File, index: number): void {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `Traveler ${index + 1} passport file exceeds the 10MB size limit. Received: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      );
    }
  }
}