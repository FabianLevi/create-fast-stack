# Instructions

## Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- tRPC v11 + React Query v5
- Tailwind CSS v4
- Geist font

## Getting Started

```bash
pnpm install
pnpm dev
```

Server runs at `http://localhost:3000`.

## Commands

- `pnpm dev` — Development server with hot reload
- `pnpm build` — Build for production
- `pnpm start` — Start production server
- `pnpm lint` — Run Next.js linter

## Project Structure

```
src/
├── app/
│   ├── api/trpc/[trpc]/route.ts  # tRPC API handler
│   ├── page.tsx                   # Home page (tRPC health query)
│   ├── layout.tsx                 # Root layout + QueryProvider
│   └── globals.css                # Tailwind imports + theme tokens
├── server/
│   ├── trpc.ts                    # tRPC init, router/procedure exports
│   └── routers/
│       ├── index.ts               # Root appRouter + AppRouter type
│       └── health.ts              # Health check procedure
├── trpc/
│   ├── client.tsx                 # QueryProvider (client-side)
│   ├── server.tsx                 # Server-side helpers (prefetch, HydrateClient)
│   ├── query-client.ts            # QueryClient factory
│   └── utils.ts                   # useTRPC hook + TRPCProvider
├── components/ui/                 # Reusable UI components (shadcn-compatible)
└── lib/utils.ts                   # cn() utility for class merging
```

## Environment

- `BACKEND_URL` — Backend REST API URL, server-side only (default: `http://localhost:8000`)

## tRPC Architecture

```
Browser (useTRPC hooks) → /api/trpc (Next.js tRPC server) → REST backend
```

tRPC runs as a proxy in Next.js API routes. Backends are REST APIs — the tRPC server fetches from them and provides type-safe responses to the client.

### Adding a new endpoint

1. Create router in `src/server/routers/my-feature.ts`:
```typescript
import { publicProcedure, router } from "../trpc";

export const myFeatureRouter = router({
  get: publicProcedure.query(async () => {
    const res = await fetch(`${process.env.BACKEND_URL}/my-endpoint`);
    return res.json();
  }),
});
```

2. Register in `src/server/routers/index.ts`:
```typescript
export const appRouter = router({
  health: healthRouter,
  myFeature: myFeatureRouter,
});
```

3. Use in component:
```typescript
const trpc = useTRPC();
const { data } = useQuery(trpc.myFeature.get.queryOptions());
```

## Conventions

- PascalCase for components
- kebab-case for file names
- Imports: use `@/` path alias (e.g. `import { cn } from "@/lib/utils"`)
- Styling: Tailwind classes + `cn()` for conditional merging
- `use client` for client components
- TypeScript strict mode enforced

## Backend Connectivity

The home page uses `trpc.health.check.useQuery()` via tRPC. The tRPC server route (`/api/trpc`) fetches `{BACKEND_URL}/health` server-side. Ensure your backend is running and has CORS enabled for `localhost:3000`.
