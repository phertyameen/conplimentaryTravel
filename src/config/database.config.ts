import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '1433', 10),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  name: process.env.DATABASE_NAME,
  instanceName: process.env.INSTANCE_NAME,
  synchronize: process.env.DATABASE_SYNC === 'true',
  autoload: process.env.DATABASE_LOAD === 'true',
}));