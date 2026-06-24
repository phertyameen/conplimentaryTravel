import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, ContainerClient, BlockBlobClient } from '@azure/storage-blob';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * StorageService: Azure Blob Storage implementation.
 *
 * Each uploaded passport file is stored in a dedicated Azure Blob container.
 * The public URL returned is saved to the Traveler entity in the DB and
 * included in the Leadway notification email and Excel export.
 *
 * Container access: set to "Blob" (public read) in Azure Portal so URLs
 * are directly accessible without SAS tokens.
 * For private containers, replace getPublicUrl() with generateSasUrl().
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly containerClient: ContainerClient;
  private readonly containerName: string;

  constructor(private readonly config: ConfigService) {
    const connectionString = this.config.get<string>(
      'appConfig.azureStorageConnectionString',
    );
    this.containerName = this.config.get<string>(
      'appConfig.azureStorageContainerName',
    ) || 'passports';

    if (!connectionString) {
      throw new Error(
        'AZURE_STORAGE_CONNECTION_STRING is not set in environment variables.',
      );
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = blobServiceClient.getContainerClient(this.containerName);
  }

  /**
   * Uploads a file buffer to Azure Blob Storage.
   * Returns the public URL of the stored blob.
   */
  async save(file: Express.Multer.File): Promise<string> {
    try {
      // Ensure container exists (idempotent — safe to call every time)
      await this.containerClient.createIfNotExists({ access: 'blob' });

      const ext = path.extname(file.originalname);
      const blobName = `${uuidv4()}${ext}`;

      const blockBlobClient: BlockBlobClient =
        this.containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype,
        },
      });

      const url = blockBlobClient.url;
      this.logger.log(`File uploaded to Azure Blob: ${url}`);
      return url;
    } catch (error) {
      this.logger.error('Failed to upload file to Azure Blob Storage', error);
      throw new InternalServerErrorException(
        'File could not be uploaded. Please try again.',
      );
    }
  }

  /**
   * Deletes a blob by its full URL.
   * Used for cleanup when DB save fails after upload.
   */
  async delete(fileUrl: string): Promise<void> {
    try {
      const blobName = this.extractBlobName(fileUrl);
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists();
      this.logger.log(`Blob deleted: ${blobName}`);
    } catch (error) {
      this.logger.warn(`Could not delete blob at URL: ${fileUrl}`, error);
    }
  }

  // Private Helpers

  /**
   * Extracts blob name from a full Azure Blob URL.
   * e.g. https://account.blob.core.windows.net/passports/abc.pdf → abc.pdf
   */
  private extractBlobName(fileUrl: string): string {
    const parts = fileUrl.split('/');
    return parts[parts.length - 1];
  }
}