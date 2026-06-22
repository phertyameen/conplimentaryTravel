import { registerAs } from '@nestjs/config';

export default registerAs('appConfig', () => ({
  environment: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',
  mailHost: process.env.MAIL_HOST,
  mailPort: process.env.SMTP_PORT,
  smtpUsername: process.env.SMTP_USERNAME,
  smtpPassword: process.env.SMTP_PASSWORD,
  mailSecure: process.env.MAIL_SECURE === 'true',
}));