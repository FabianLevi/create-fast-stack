import { createTRPCContext } from '@trpc/tanstack-react-query';
import type { AppRouter } from '@/server/routers';

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();
