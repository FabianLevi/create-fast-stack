import { publicProcedure, router } from '../trpc';

export const healthRouter = router({
  check: publicProcedure.query(async () => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/health`);

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = (await response.json()) as { status: string };
    return { status: data.status };
  }),
});
