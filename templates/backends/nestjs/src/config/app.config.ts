import * as Joi from 'joi';
import { Environment } from './env.enum';

export const validationSchema = Joi.object({
  APP_ENV: Joi.string()
    .valid(...Object.values(Environment))
    .default(Environment.DEVELOP),
  APP_HOST: Joi.string().default('127.0.0.1'),
  APP_PORT: Joi.number().default(8000),
  APP_WORKERS: Joi.number().default(1),
});

export const appConfigFactory = () => ({
  env: process.env.APP_ENV || Environment.DEVELOP,
  host: process.env.APP_HOST || '127.0.0.1',
  port: parseInt(process.env.APP_PORT || '8000', 10),
  workers: parseInt(process.env.APP_WORKERS || '1', 10),
});

export type AppConfig = ReturnType<typeof appConfigFactory>;
