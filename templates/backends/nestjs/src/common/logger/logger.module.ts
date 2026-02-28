import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { Environment } from '../../config/env.enum';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const env = configService.get<string>('APP_ENV', Environment.DEVELOP);
        const isDevelop = env === Environment.DEVELOP;

        return {
          pinoHttp: {
            genReqId: () => {
              return require('crypto').randomUUID();
            },
            transport: isDevelop
              ? {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    colorize: true,
                  },
                }
              : undefined,
          },
          exclude: ['/health'],
          autoLogging: true,
        };
      },
    }),
  ],
})
export class LoggerModule {}
