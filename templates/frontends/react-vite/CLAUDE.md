# Instructions

## Stack

React 19, Vite 7, TypeScript 5.8, Tailwind CSS v4, TanStack Query v5, Vitest, ESLint 9, Prettier

## Commands

- `pnpm install` — install dependencies
- `pnpm dev` — start dev server (port 5173)
- `pnpm build` — build for production (output: `dist/`)
- `pnpm preview` — preview production build
- `pnpm lint` — run ESLint
- `pnpm type-check` — run TypeScript type checking
- `pnpm test` — run tests in watch mode
- `pnpm test:run` — run tests once

## Project Structure

```
src/
├── components/ui/       # Reusable UI components (shadcn-compatible)
├── hooks/use-health.ts  # React Query hooks (useQuery wrappers)
├── lib/
│   ├── api/client.ts    # Base apiRequest() — fetch wrapper
│   ├── api/health.ts    # fetchHealth() — pure function, no React
│   ├── query-client.ts  # QueryClient singleton
│   └── utils.ts         # cn() utility for class merging
├── test/setup.ts        # Vitest setup (jest-dom matchers, cleanup)
├── environment.ts       # Zod-validated environment variables
├── App.tsx              # Root component
├── App.css              # Tailwind imports + theme tokens
└── main.tsx             # Entry point
```

## API Layer (visq-front pattern)

```
lib/api/client.ts      → Base fetch wrapper (URL, error handling)
lib/api/{domain}.ts    → Pure async functions per domain (fetchHealth, fetchUsers, etc.)
hooks/use-{domain}.ts  → Thin useQuery/useMutation wrappers
```

API functions are **pure** — no React, no hooks. Testable without a component tree. Hooks are thin wrappers that call the API functions via TanStack Query.

## Conventions

- Components: PascalCase (e.g. `Header.tsx`, `UserCard.tsx`)
- Files: kebab-case (e.g. `use-fetch.ts`, `api-client.ts`)
- Imports: use `@/` path alias (e.g. `import { cn } from "@/lib/utils"`)
- Import order: builtin > external > internal > parent > sibling > index (enforced by eslint-plugin-perfectionist)
- Env vars: `VITE_*` prefix, validated via `src/environment.ts`
- Styling: Tailwind classes + `cn()` for conditional merging
- Type imports: `import type { ... }`

## Key rules

- No `any` types — use `unknown`
- Early returns, no deep nesting
- Const types pattern for objects (`as const`)
- Strict mode enabled
- Pre-commit hook runs eslint + prettier on staged files

## Environment

Environment variables are validated at runtime with Zod in `src/environment.ts`. Import `env` from `@/environment` instead of using `import.meta.env` directly.

## Backend connectivity

App fetches `env.backendUrl/health` on mount (default: http://localhost:8000). Backend should respond with `{ "status": "ok" }`.
