import { z } from 'zod';

const envSchema = z.object({
  VITE_BACKEND_URL: z.string().url().default('http://localhost:8000'),
  VITE_APP_NAME: z.string().default('{{baseName}}'),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error(
    'Invalid environment variables:',
    parsed.error.flatten().fieldErrors,
  );
  throw new Error('Invalid environment variables');
}

export const env = {
  backendUrl: parsed.data.VITE_BACKEND_URL,
  appName: parsed.data.VITE_APP_NAME,
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
} as const;
