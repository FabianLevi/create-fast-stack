# React Vite Template Upgrade (pentoai-aligned)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade react-vite template to match pentoai/react-base-template DX quality: ESLint 9 flat config, Prettier, Vitest + Testing Library, Husky + lint-staged, Zod env validation, version bumps, TS project references, VSCode extensions.

**Architecture:** Config-only changes + 2 new source files (`environment.ts`, `test/setup.ts`). No changes to existing components. App.tsx updated to use validated env. Template stays bun-native (not pnpm).

**Tech Stack:** Vite 7, TypeScript 5.8, ESLint 9, Prettier 3, Vitest 3, Testing Library, Husky 9, lint-staged, Zod 4, happy-dom

**Template root:** `templates/frontends/react-vite/`

---

### Task 1: Upgrade package.json — versions, deps, scripts

**Files:**
- Modify: `templates/frontends/react-vite/package.json`

**Step 1: Replace package.json with upgraded versions and new deps**

```json
{
  "name": "{{projectName}}",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "tailwind-merge": "^3.0.0",
    "tailwindcss": "^4.1.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.30.0",
    "@tailwindcss/vite": "^4.1.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^4.6.0",
    "eslint": "^9.32.0",
    "eslint-config-prettier": "^10.1.0",
    "eslint-plugin-perfectionist": "^4.15.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^16.0.0",
    "happy-dom": "^18.0.0",
    "husky": "^9.1.0",
    "lint-staged": "^16.1.0",
    "prettier": "^3.6.0",
    "prettier-plugin-tailwindcss": "^0.6.14",
    "typescript": "^5.8.0",
    "typescript-eslint": "^8.35.0",
    "vite": "^7.0.0",
    "vite-tsconfig-paths": "^5.1.0",
    "vitest": "^3.2.0"
  }
}
```

**Step 2: Verify JSON validity**

Visually confirm no trailing commas or syntax errors.

**Step 3: Commit**

```bash
git add templates/frontends/react-vite/package.json
git commit -m "feat(templates): upgrade react-vite deps — vite 7, ts 5.8, add eslint/prettier/vitest/husky"
```

---

### Task 2: TypeScript project references (3-file setup)

**Files:**
- Modify: `templates/frontends/react-vite/tsconfig.json` (becomes root references file)
- Modify: `templates/frontends/react-vite/tsconfig.node.json`
- Create: `templates/frontends/react-vite/tsconfig.app.json`

**Step 1: Create tsconfig.app.json (app-specific config)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

**Step 2: Update tsconfig.json to project references root**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

**Step 3: Update tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

**Step 4: Commit**

```bash
git add templates/frontends/react-vite/tsconfig.json templates/frontends/react-vite/tsconfig.app.json templates/frontends/react-vite/tsconfig.node.json
git commit -m "feat(templates): react-vite TS project references — 3-file tsconfig setup"
```

---

### Task 3: ESLint 9 flat config

**Files:**
- Create: `templates/frontends/react-vite/eslint.config.js`

**Step 1: Create eslint.config.js**

```js
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import perfectionist from 'eslint-plugin-perfectionist';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      perfectionist,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'alphabetical',
          order: 'asc',
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
        },
      ],
    },
  },
  prettier,
);
```

**Step 2: Commit**

```bash
git add templates/frontends/react-vite/eslint.config.js
git commit -m "feat(templates): add ESLint 9 flat config — ts-eslint, react-hooks, perfectionist, prettier"
```

---

### Task 4: Prettier config

**Files:**
- Create: `templates/frontends/react-vite/.prettierrc`

**Step 1: Create .prettierrc**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 80,
  "tabWidth": 2,
  "arrowParens": "avoid",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**Step 2: Commit**

```bash
git add templates/frontends/react-vite/.prettierrc
git commit -m "feat(templates): add Prettier config with tailwind plugin"
```

---

### Task 5: Vitest + Testing Library setup

**Files:**
- Create: `templates/frontends/react-vite/vitest.config.ts`
- Create: `templates/frontends/react-vite/src/test/setup.ts`

**Step 1: Create vitest.config.ts**

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
});
```

**Step 2: Create src/test/setup.ts**

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

**Step 3: Commit**

```bash
git add templates/frontends/react-vite/vitest.config.ts templates/frontends/react-vite/src/test/setup.ts
git commit -m "feat(templates): add Vitest + Testing Library — happy-dom, jest-dom matchers, auto-cleanup"
```

---

### Task 6: Husky + lint-staged

**Files:**
- Create: `templates/frontends/react-vite/.husky/pre-commit`
- Create: `templates/frontends/react-vite/.lintstagedrc.json`

**Step 1: Create .husky/pre-commit**

```sh
npx lint-staged
```

Note: This file needs no shebang — Husky v9 handles execution.

**Step 2: Create .lintstagedrc.json**

```json
{
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml,css}": ["prettier --write"]
}
```

**Step 3: Commit**

```bash
git add templates/frontends/react-vite/.husky/pre-commit templates/frontends/react-vite/.lintstagedrc.json
git commit -m "feat(templates): add Husky 9 + lint-staged — pre-commit lint and format"
```

---

### Task 7: Zod env validation

**Files:**
- Create: `templates/frontends/react-vite/src/environment.ts`
- Modify: `templates/frontends/react-vite/src/App.tsx` (use validated env)
- Modify: `templates/frontends/react-vite/.env.example` (add more vars)

**Step 1: Create src/environment.ts**

```ts
import { z } from 'zod';

const envSchema = z.object({
  VITE_BACKEND_URL: z.string().url().default('http://localhost:8000'),
  VITE_APP_NAME: z.string().default('{{baseName}}'),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = {
  backendUrl: parsed.data.VITE_BACKEND_URL,
  appName: parsed.data.VITE_APP_NAME,
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
} as const;
```

**Step 2: Update App.tsx to use env**

```tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/environment";

interface HealthResponse {
  status: string;
}

export default function App() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch(`${env.backendUrl}/health`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data: HealthResponse = await response.json();
        setStatus(data.status);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch");
        setStatus("");
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-4xl font-bold tracking-tight">{env.appName}</h1>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Backend Response</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {loading && (
            <p className="text-muted-foreground">Loading...</p>
          )}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
              Error: {error}
            </div>
          )}
          {status && (
            <div className="rounded-md bg-primary/10 p-3 text-sm font-medium">
              {status}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground font-mono">
        Backend: {env.backendUrl}
      </p>
    </main>
  );
}
```

**Step 3: Update .env.example**

```
VITE_BACKEND_URL=http://localhost:8000
VITE_APP_NAME={{baseName}}
```

**Step 4: Commit**

```bash
git add templates/frontends/react-vite/src/environment.ts templates/frontends/react-vite/src/App.tsx templates/frontends/react-vite/.env.example
git commit -m "feat(templates): add Zod env validation — validated env object replaces raw import.meta.env"
```

---

### Task 8: Update vite.config.ts — add tsconfigPaths

**Files:**
- Modify: `templates/frontends/react-vite/vite.config.ts`

**Step 1: Update vite.config.ts**

```ts
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
});
```

**Step 2: Commit**

```bash
git add templates/frontends/react-vite/vite.config.ts
git commit -m "feat(templates): add vite-tsconfig-paths plugin"
```

---

### Task 9: VSCode extensions.json

**Files:**
- Create: `templates/frontends/react-vite/.vscode/extensions.json`

**Step 1: Create .vscode/extensions.json**

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode"
  ]
}
```

**Step 2: Update .gitignore to allow .vscode/extensions.json**

In `.gitignore`, change `.vscode` to:
```
.vscode/*
!.vscode/extensions.json
```

**Step 3: Commit**

```bash
git add templates/frontends/react-vite/.vscode/extensions.json templates/frontends/react-vite/.gitignore
git commit -m "feat(templates): add VSCode recommended extensions"
```

---

### Task 10: Update main.tsx, CLAUDE.md, README.md

**Files:**
- Modify: `templates/frontends/react-vite/src/main.tsx` (defensive root check)
- Modify: `templates/frontends/react-vite/CLAUDE.md` (reflect new tooling)
- Modify: `templates/frontends/react-vite/README.md` (fix React 18→19, add new scripts)

**Step 1: Update main.tsx with defensive root mounting**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

const rootElement = document.getElementById("root")!;

if (!rootElement.innerHTML) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
```

**Step 2: Update CLAUDE.md**

```md
# Instructions

## Stack

React 19, Vite 7, TypeScript 5.8, Tailwind CSS v4, Vitest, ESLint 9, Prettier

## Commands

- `npm install` — install dependencies
- `npm run dev` — start dev server (port 5173)
- `npm run build` — build for production (output: `dist/`)
- `npm run preview` — preview production build
- `npm run lint` — run ESLint
- `npm run type-check` — run TypeScript type checking
- `npm run test` — run tests in watch mode
- `npm run test:run` — run tests once

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
```

**Step 3: Update README.md**

```md
# {{projectName}}

React 19 + Vite frontend template.

## Getting started

Install dependencies:
```bash
npm install
```

Set up git hooks:
```bash
npx husky
```

Start the development server:
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Environment

Copy `.env.example` to `.env.local` and update values. Environment variables are validated with Zod at runtime — see `src/environment.ts`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript checks |
| `npm run test` | Run tests (watch mode) |
| `npm run test:run` | Run tests once |
```

**Step 4: Commit**

```bash
git add templates/frontends/react-vite/src/main.tsx templates/frontends/react-vite/CLAUDE.md templates/frontends/react-vite/README.md
git commit -m "feat(templates): update main.tsx, CLAUDE.md, README.md — reflect new tooling"
```
