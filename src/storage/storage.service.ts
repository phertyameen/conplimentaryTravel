import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from '@azure/storage-blob';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * StorageService - Azure Blob Storage with SAS Token access.
 *
 * Container is PRIVATE - no public access.
 * Files are accessed via time-limited SAS tokens generated on demand.
 * SAS token approach follows: https://dev.to/vaibhav9017/generate-sas-token-for-azure-api-management-using-node-js-3gl2
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly containerClient: ContainerClient;
  private readonly containerName: string;
  private readonly accountName: string;
  private readonly accountKey: string;

  constructor(private readonly config: ConfigService) {
    const connectionString = this.config.get<string>(
      'appConfig.azureStorageConnectionString',
    );
    this.containerName =
      this.config.get<string>('appConfig.azureStorageContainerName') ||
      'passports';

    if (!connectionString) {
      throw new Error(
        'AZURE_STORAGE_CONNECTION_STRING is not set in environment variables.',
      );
    }

    // Parse account name and key from connection string
    // Format: DefaultEndpointsProtocol=https;AccountName=xxx;AccountKey=yyy;...
    this.accountName = this.extractFromConnectionString(
      connectionString,
      'AccountName',
    );
    this.accountKey = this.extractFromConnectionString(
      connectionString,
      'AccountKey',
    );

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = blobServiceClient.getContainerClient(
      this.containerName,
    );
  }

  /**
   * Uploads a file buffer to Azure Blob Storage (private container).
   * Blob name is built from the traveler's full name + uuid + extension
   * e.g. "John_Doe_a1b2c3d4.pdf"
   *
   * Returns the plain blob URL (no SAS - call generateSasUrl() to view).
   */
  async save(
    file: Express.Multer.File,
    travelerFullName: string,
  ): Promise<{ blobUrl: string; blobName: string }> {
    try {
      // Private container - no public access
      await this.containerClient.createIfNotExists();

      const ext = path.extname(file.originalname);
      const safeName = this.sanitizeName(travelerFullName);
      const blobName = `${safeName}_${uuidv4()}${ext}`;

      const blockBlobClient: BlockBlobClient =
        this.containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype,
        },
      });

      this.logger.log(`Uploaded to Azure Blob: ${blobName}`);

      return {
        blobUrl: blockBlobClient.url, // base URL (no SAS)
        blobName,
      };
    } catch (error) {
      this.logger.error('Failed to upload file to Azure Blob Storage', error);
      throw new InternalServerErrorException(
        'File could not be uploaded. Please try again.',
      );
    }
  }

  /**
   * Generates a time-limited SAS token URL for a blob.
   * Grants read-only access for the specified duration (default 1 hour).
   *
   * Reference: https://dev.to/vaibhav9017/generate-sas-token-for-azure-api-management-using-node-js-3gl2
   *
   * @param blobName - the blob name stored in DB (e.g. "John_Doe_uuid.pdf")
   * @param expiryMinutes - how long the link is valid (default 60 minutes)
   * @returns full SAS URL the user can open directly in browser
   */
  generateSasUrl(blobName: string, expiryMinutes = 60): string {
    const sharedKeyCredential = new StorageSharedKeyCredential(
      this.accountName,
      this.accountKey,
    );

    const startsOn = new Date();
    const expiresOn = new Date(startsOn);
    expiresOn.setMinutes(expiresOn.getMinutes() + expiryMinutes);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: this.containerName,
        blobName,
        permissions: BlobSASPermissions.parse('r'), // read-only
        startsOn,
        expiresOn,
      },
      sharedKeyCredential,
    ).toString();

    const sasUrl = `https://${this.accountName}.blob.core.windows.net/${this.containerName}/${blobName}?${sasToken}`;

    this.logger.log(
      `SAS URL generated for blob: ${blobName} (expires in ${expiryMinutes} min)`,
    );

    return sasUrl;
  }

  /**
   * Deletes a blob by its name.
   * Used for cleanup when DB save fails after upload.
   */
  async delete(blobName: string): Promise<void> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists();
      this.logger.log(`Blob deleted: ${blobName}`);
    } catch (error) {
      this.logger.warn(`Could not delete blob: ${blobName}`, error);
    }
  }

  /**
   * Converts a traveler name to a safe blob name segment.
   * e.g. "John Doe-Smith" → "John_Doe-Smith"
   */
  private sanitizeName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, '_') // spaces → underscores
      .replace(/[^a-zA-Z0-9_\-]/g, '') // remove special chars
      .substring(0, 50); // cap length
  }

  /**
   * Extracts a value from an Azure connection string.
   * e.g. extractFromConnectionString(str, 'AccountName') → 'mystorageaccount'
   */
  private extractFromConnectionString(
    connectionString: string,
    key: string,
  ): string {
    const match = connectionString
      .split(';')
      .find((part) => part.startsWith(`${key}=`));

    if (!match) {
      throw new Error(
        `Could not extract ${key} from AZURE_STORAGE_CONNECTION_STRING.`,
      );
    }

    return match.split('=').slice(1).join('='); // handles keys with '=' in value
  }
}