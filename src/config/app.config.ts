import { registerAs } from '@nestjs/config';

export default registerAs('appConfig', () => ({
  environment: process.env.NODE_ENV || 'development',

  // Mail
  mailHost: process.env.MAIL_HOST,
  mailPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUsername: process.env.SMTP_USERNAME,
  smtpPassword: process.env.SMTP_PASSWORD,
  mailSecure: process.env.MAIL_SECURE === 'true',

  // Azure
  azureStorageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  azureStorageContainerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'passports',
}));