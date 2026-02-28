import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema, appConfigFactory } from './config/app.config';
import { LoggerModule } from './common/logger/logger.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema,
      load: [appConfigFactory],
    }),
    LoggerModule,
    HealthModule,
  ],
})
export class AppModule {}
