# Instructions

## Stack

Angular 19, TypeScript 5.7–5.8 (Angular requires <5.9), Tailwind CSS v4 (PostCSS), Vitest + @analogjs/vitest-angular, angular-eslint, Prettier

## Commands

- `pnpm install` — install dependencies
- `pnpm start` — start dev server (port 4200)
- `pnpm build` — build for production (output: `dist/`)
- `pnpm lint` — run angular-eslint
- `pnpm test` — run tests in watch mode
- `pnpm test:run` — run tests once

## Project Structure

```
src/
├── app/
│   ├── pages/home/       # Home page component
│   ├── services/          # Injectable services (HealthService)
│   ├── app.component.ts   # Root component (router-outlet)
│   ├── app.config.ts      # App configuration (providers)
│   └── app.routes.ts      # Route definitions (lazy-loaded)
├── environments/          # Environment configs (dev/prod)
├── styles.css             # Tailwind imports + theme tokens
├── main.ts                # Bootstrap entry point
└── index.html             # HTML shell
```

## Conventions

- Components: standalone only, no NgModules
- Change detection: `ChangeDetectionStrategy.OnPush` on all components
- State: signals (`signal()`, `computed()`) for reactive state
- DI: `inject()` function, not constructor injection
- Control flow: `@if`, `@for`, `@switch` (new syntax, no `*ngIf`/`*ngFor`)
- HTTP: `HttpClient` via `inject(HttpClient)`
- RxJS cleanup: `takeUntilDestroyed()` in constructor for automatic unsubscription
- Routes: lazy-loaded with `loadComponent` (no eager imports, no module-based `loadChildren`)
- Router: `withComponentInputBinding()` enabled for route param → input binding
- Files: kebab-case (`health.service.ts`, `home.component.ts`)
- Imports: use `@/` path alias (e.g. `import { environment } from '@/environments/environment'`)
- Styling: Tailwind classes in templates, `@tailwindcss/postcss` plugin

## Key Rules

- No `any` types — use `unknown`
- No NgModules — standalone components only
- No Angular Material — Tailwind for all styling
- No `experimentalDecorators` — Angular compiler handles decorators natively
- `useDefineForClassFields: true` in tsconfig
- Strict mode enabled (strict templates, strict injection, strict input accessors)
- Environment files for configuration (`src/environments/`), fileReplacements in angular.json swaps prod/dev

## Backend Connectivity

App imports `environment.ts` (prod values). In dev, angular.json replaces it with `environment.development.ts`. Both default `backendUrl` to `http://localhost:8000`. The `HealthService` fetches `/health` from that URL. Backend should respond with `{ "status": "ok" }`.
