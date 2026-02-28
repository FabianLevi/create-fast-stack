# {{projectName}}

React 19 + Vite frontend template.

## Getting started

Install dependencies:
```bash
pnpm install
```

Set up git hooks:
```bash
pnpm exec husky
```

Start the development server:
```bash
pnpm dev
```

Open http://localhost:5173 in your browser.

## Environment

Copy `.env.example` to `.env.local` and update values. Environment variables are validated with Zod at runtime — see `src/environment.ts`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | Run TypeScript checks |
| `pnpm test` | Run tests (watch mode) |
| `pnpm test:run` | Run tests once |
