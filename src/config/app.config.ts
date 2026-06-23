import { registerAs } from '@nestjs/config';

export default registerAs('appConfig', () => ({
  environment: process.env.NODE_ENV || 'development',

  // Mail
  mailHost: process.env.MAIL_HOST,
  mailPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUsername: process.env.SMTP_USERNAME,
  smtpPassword: process.env.SMTP_PASSWORD,
  mailSecure: process.env.MAIL_SECURE === 'true',

  // Storage
  uploadDir: process.env.UPLOAD_DIR || './uploads/passports',
  baseUrl: process.env.BASE_URL || 'http://localhost:3001',
}));