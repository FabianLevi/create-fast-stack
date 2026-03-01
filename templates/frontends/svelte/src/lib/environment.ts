export const env = {
  backendUrl: import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000',
  appName: import.meta.env.VITE_APP_NAME ?? '{{baseName}}',
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
} as const;
