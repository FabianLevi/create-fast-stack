# Instructions

## Stack

React 19, Vite 7, TypeScript 5.8, Tailwind CSS v4, Vitest, ESLint 9, Prettier

## Commands

- `pnpm install` — install dependencies
- `pnpmdev` — start dev server (port 5173)
- `pnpmbuild` — build for production (output: `dist/`)
- `pnpmpreview` — preview production build
- `pnpmlint` — run ESLint
- `pnpmtype-check` — run TypeScript type checking
- `pnpmtest` — run tests in watch mode
- `pnpmtest:run` — run tests once

## Project Structure

```
src/
├── components/ui/     # Reusable UI components (shadcn-compatible)
├── lib/utils.ts       # cn() utility for class merging
├── test/setup.ts      # Vitest setup (jest-dom matchers, cleanup)
├── environment.ts     # Zod-validated environment variables
├── App.tsx            # Root component
├── App.css            # Tailwind imports + theme tokens
└── main.tsx           # Entry point
```

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
