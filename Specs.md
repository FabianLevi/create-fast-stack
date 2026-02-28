# create-fast-stack — Project Spec v1

## Overview

Polyglot CLI scaffolder that creates **independent projects** in sibling folders with separate git repos. Unlike create-better-t-stack (TypeScript-only monorepo), this targets multi-language backends and truly separate projects.

## Tech Stack (CLI itself)

- **Runtime**: Bun
- **Language**: TypeScript
- **Prompts**: @clack/prompts
- **CLI parsing**: commander
- **Validation**: zod

## Project Structure

```
create-fast-stack/
├── package.json
├── tsconfig.json
├── .gitignore
├── CLAUDE.md                   # Agent instructions for CLI repo
├── AGENTS.md                   # Vendor-neutral agent instructions
├── Specs.md                    # This spec
├── src/
│   ├── index.ts                # #!/usr/bin/env bun entry
│   ├── cli.ts                  # Commander setup + main flow
│   ├── prompts.ts              # @clack/prompts interactive flow
│   ├── config.ts               # Zod validation schemas
│   ├── generator.ts            # Template copy + {{var}} substitution
│   ├── git.ts                  # Git init per generated project
│   └── types.ts                # Type definitions
├── tests/                      # bun:test
│   ├── scaffold.test.ts        # Tier 1: file generation, var substitution
│   └── templates.test.ts       # Tier 2: template validation
├── templates/
│   ├── backends/
│   │   ├── python-fastapi/
│   │   ├── go-fiber/
│   │   └── nestjs/
│   └── frontends/
│       ├── react-vite/
│       └── nextjs/
└── README.md
```

## User Flow

```
$ bun run src/index.ts

┌ Create Fast Stack
│
◇ Project name:
│ test
│
◆ What do you want to create? (select all that apply)
│ ◻ Backend
│ ◻ Frontend
│ (future: CLI, Infra, etc.)
│
◆ Backend framework:        ← only if Backend selected
│ ○ Python (FastAPI)
│ ○ Go (Fiber)
│ ○ NestJS
│
◆ Frontend framework:       ← only if Frontend selected
│ ○ React (Vite)
│ ○ Next.js
│
│ (v2: granular sub-options per framework — router, runtime,
│  styling, ORM, auth, etc. Similar to create-better-t-stack)
│
◇ Projects will be created as:
│   test-backend/
│   test-frontend/
│ ○ Yes, looks good
│ ○ No, let me customize names
│
◆ Initialize git in each project?
│ ○ Yes (separate git repo per project)
│ ○ No
│
└ Done! Created test-backend + test-frontend
```

**Selection model**: Multi-select — each project type is independent. User picks any combination. Future types (CLI, Infra) added as new checkboxes without changing flow. Validate at least 1 type selected before proceeding.

**Naming convention**: `{name}-{type}` by default (e.g. `test-backend`, `test-frontend`). User can confirm or customize. If "No, let me customize names" is selected, prompt a text input for each project folder name.

## Output Layout

Parent folder with independent sub-projects inside:

```
cwd/
└── my-app/                    # Parent folder (no git)
    ├── my-app-backend/        # Independent git repo
    └── my-app-frontend/       # Independent git repo
```

If `my-app/` already exists → abort with error: "Folder my-app/ already exists. Choose a different name."

**Cancellation (Ctrl+C)**: Cleanup the parent `my-app/` folder since we just created it. Safe because we verified it didn't exist before starting.

**Post-scaffold output**: Print framework-specific next steps:
```
Done! Created my-app/

Next steps:
  Backend:
    cd my-app/my-app-backend
    uv sync && uv run uvicorn main:app --reload

  Frontend:
    cd my-app/my-app-frontend
    npm install && npm run dev

  Open http://localhost:5173 to see frontend connected to backend.
```

## Template Connectivity

When both frontend and backend are selected, they come pre-wired:
- **Backend** exposes `GET /hello` → returns `{ "message": "Hello from <framework>!" }`
- **Frontend** fetches `http://localhost:8000/hello` on load and displays the response
- Backend has CORS enabled for `localhost:5173` (Vite) and `localhost:3000` (Next.js)
- This proves the stack is working end-to-end out of the box, similar to create-better-t-stack

When only backend or only frontend is selected, templates still work standalone.

## Backend Templates

Each template is a minimal working server with `GET /health` and `GET /hello` endpoints.

### Python (FastAPI)
- `main.py` — FastAPI app with CORS, uvicorn, reads `PORT` from env
- `pyproject.toml` — dependencies managed by uv
- `.python-version` (3.12)
- `.env.example` — `PORT=8000`
- `.gitignore`, `README.md`, `CLAUDE.md`
- Port: 8000 (default, configurable via `.env`)
- Package manager: uv (`uv sync` to install, `uv run uvicorn main:app` to start)

### Go (Fiber)
- `main.go` — Fiber server, reads `PORT` from env
- `go.mod`
- `.env.example` — `PORT=8000`
- `.gitignore`, `README.md`, `CLAUDE.md`
- Port: 8000 (default, configurable via `.env`)

### NestJS
- `src/main.ts` — NestJS bootstrap, reads `PORT` from env
- `src/app.module.ts`, `src/app.controller.ts`, `src/app.service.ts`
- `package.json`, `tsconfig.json`
- `.env.example` — `PORT=8000`
- `.gitignore`, `README.md`, `CLAUDE.md`
- Port: 8000 (default, configurable via `.env`)

## Frontend Templates

### React (Vite)
- `src/main.tsx`, `src/App.tsx`, `src/App.css`
- `vite.config.ts`, `tsconfig.json`, `index.html`
- `package.json`
- `.env.example` — `VITE_BACKEND_URL=http://localhost:8000`
- `.gitignore`, `README.md`, `CLAUDE.md`
- Port: 5173
- `App.tsx` fetches `VITE_BACKEND_URL/hello` and displays response

### Next.js
- `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`
- `next.config.ts`, `tsconfig.json`
- `package.json`
- `.env.example` — `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000`
- `.gitignore`, `README.md`, `CLAUDE.md`
- Port: 3000
- `page.tsx` fetches `NEXT_PUBLIC_BACKEND_URL/hello` and displays response

## Template Variables

Two variables only, passed to all template files during copy:

| Variable | Value | Example |
|----------|-------|---------|
| `{{projectName}}` | Folder/package name | `my-app-backend` |
| `{{baseName}}` | Root name from user input | `my-app` |

Usage per framework:

| File | Variable | Result |
|------|----------|--------|
| `go.mod` | `module {{projectName}}` | `module my-app-backend` |
| `Cargo.toml` | `name = "{{projectName}}"` | `name = "my-app-backend"` |
| `package.json` | `"name": "{{projectName}}"` | `"name": "my-app-backend"` |
| `pyproject.toml` | `name = "{{projectName}}"` | `name = "my-app-backend"` |
| `README.md` | `# {{projectName}}` | `# my-app-backend` |
| `App.tsx` | `<h1>{{baseName}}</h1>` | `<h1>my-app</h1>` |

## Template Resolution

Templates located via `import.meta.dir` (Bun's `__dirname`):
```typescript
const templatesDir = path.join(import.meta.dir, '..', 'templates');
```
Works for both dev (`bun run src/index.ts`) and future npm publish (include `templates/` in package `files` field).

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Sibling folders, not monorepo | True project independence, separate git histories |
| File copy + `{{var}}` replacement | No template engine dependency, simple and debuggable |
| @clack/prompts + commander | Beautiful UX (clack) + solid arg parsing (commander) |
| Templates in-repo, not registry | v1 simplicity, no infra overhead |
| Minimal starters | Low friction, each template runs immediately |
| Flat `src/` layout | Single package, no need for monorepo structure |
| No Rust (Axum) in v1 | Slow builds (5-10 min), complicates CI; can add later |
| Python uses uv, not pip | Faster, modern, handles venvs automatically |
| All backends on port 8000 | Standardized, configurable via `.env` if port is busy |

## Type Definitions

```typescript
type ProjectType = "backend" | "frontend"; // future: "cli" | "infra"
type BackendFramework = "python-fastapi" | "go-fiber" | "nestjs";
type FrontendFramework = "react-vite" | "nextjs";

interface ProjectSelection {
  type: ProjectType;
  framework: string;        // framework id within that type
  folderName: string;        // e.g. "test-backend" (customizable)
}

interface ScaffoldConfig {
  projectName: string;       // base name, e.g. "test"
  projects: ProjectSelection[];  // independently selected projects
  outputDir: string;
  initGit: boolean;          // initialize separate git repo per project
}
```

## Agent & Skill Files

Include at project root for AI-assisted development (similar to create-better-t-stack's `AGENTS.md`):

### `CLAUDE.md`
Project-level Claude Code instructions:
- Project structure & module organization
- Build/dev/test commands (`bun dev`, `bun test`, etc.)
- Coding style & naming conventions (kebab-case files, camelCase vars, PascalCase types)
- Template authoring rules (how to add new framework templates)
- Testing guidelines
- Commit conventions (conventional commits with scope: `feat(cli):`, `fix(templates):`)

### `AGENTS.md`
General agent instructions (works with Copilot, Cursor, Claude, etc.):
- Same content as CLAUDE.md but vendor-neutral format
- Covers project structure, commands, style, testing, PRs

### Generated projects also get a `CLAUDE.md`
Each scaffolded project includes a `CLAUDE.md` tailored to its stack. Example for a FastAPI backend:
```markdown
# Instructions
- Python 3.11+, FastAPI, uvicorn
- Run: `uv sync && uv run uvicorn main:app`
- Test: `pytest`
- Style: snake_case, type hints, async endpoints
```
Example for a React Vite frontend:
```markdown
# Instructions
- React 18, Vite, TypeScript
- Run: `npm install && npm run dev`
- Test: `npm test`
- Style: PascalCase components, kebab-case files
```
This makes generated projects AI-ready out of the box — any agent can immediately understand the stack, commands, and conventions.

### Purpose
- **CLI repo**: CLAUDE.md + AGENTS.md guide agents working on the CLI tool itself
- **Generated projects**: Each gets a stack-specific CLAUDE.md so users' projects are AI-ready from day one

## Implementation Phases

### Phase 0: Repo setup
0. `CLAUDE.md` — CLI repo instructions for agents
1. `AGENTS.md` — vendor-neutral agent instructions

### Phase 1: Project setup + CLI core
2. `package.json` — deps: @clack/prompts, commander, zod
3. `tsconfig.json` — strict, ESNext, bundler resolution
4. `src/types.ts` — type definitions
5. `src/config.ts` — Zod schemas, project name validation
6. `src/prompts.ts` — interactive prompt flow
7. `src/cli.ts` — commander program, orchestrates prompts → generator
8. `src/index.ts` — bin entry point

### Phase 2: Generator logic
8. `src/generator.ts` — resolve template paths, copy dirs, replace {{projectName}}
9. `src/git.ts` — git init + add + initial commit per project

### Phase 3: Backend templates (each includes stack-specific `CLAUDE.md`)
10. python-fastapi template (uv) + CLAUDE.md
11. go-fiber template + CLAUDE.md
12. nestjs template + CLAUDE.md

### Phase 4: Frontend templates (each includes stack-specific `CLAUDE.md`)
13. react-vite template + CLAUDE.md
14. nextjs template + CLAUDE.md

### Phase 5: Testing (3-tier approach, `bun:test`)

| Tier | When | Duration | What |
|------|------|----------|------|
| 1. Scaffold | Every commit | <1 min | File generation, `{{var}}` substitution, git init |
| 2. Template validation | Every PR | ~2-3 min | Endpoint defs exist in source, dep files parse, no leftover `{{` |
| 3. Server startup | Scheduled/manual | ~15-30 min | Install deps → start server → `GET /health` → verify 200 |

## Extensibility

Adding a new framework:
1. Add template dir under `templates/backends/` or `templates/frontends/`
2. Add value to type union in `types.ts`
3. Add option in `prompts.ts`
4. Generator is generic — no changes needed

## Distribution

- **v1**: GitHub-only (`git clone` + `bun run`)
- **Future**: npm publish as `create-fast-stack` (`npx create-fast-stack`)

## Roadmap

### v2: Granular frontend options (like create-better-t-stack)
After selecting a frontend framework, drill into sub-options:
- **Router**: TanStack Router, React Router, etc.
- **Runtime**: Bun, Node
- **Styling**: Tailwind, CSS Modules, Vanilla Extract
- **ORM/DB**: Drizzle, Prisma (if frontend needs data layer)
- **Auth**: Better Auth, Clerk
- **API**: tRPC, oRPC
- **Addons**: Biome, Turborepo, PWA, Tauri

Same pattern could apply to backends (DB, ORM, auth middleware, etc.)

### Future project types
- CLI scaffolding
- Infrastructure (Docker, CI/CD, Terraform)

## Resolved

- `.env.example` → yes, include in all templates (e.g. `PORT=8000`, `BACKEND_URL=http://localhost:8000`)
- `--yes` flag → not needed for v1
