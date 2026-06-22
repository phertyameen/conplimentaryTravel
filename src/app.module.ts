import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from './config/app.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env"],
      load: [appConfig, databaseConfig],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "mssql",
        host: config.get<string>("database.host"),
        port: config.get<number>("database.port"),
        username: config.get<string>("database.user"),
        password: config.get<string>("database.password"),
        database: config.get<string>("database.name"),
        synchronize: config.get<boolean>("database.synchronize"),
        autoLoadEntities: config.get<boolean>("database.autoload"),
        options: {
          encrypt: true,
          enableArithAbort: true,
          trustServerCertificate: false,
        },
        extra: {
          instanceName: config.get<string>("database.instanceName"),
        },
        // logging: ['query', 'error']
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
