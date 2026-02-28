# create-fast-stack — Agent Instructions

## Project Overview

Polyglot CLI scaffolder (Bun + TypeScript) that generates independent projects in sibling folders with separate git repos. Supports multiple backends (Python FastAPI, Go Chi, NestJS, Rust Axum) and frontends (React Vite, Next.js, Angular).

## Tech Stack
- **Runtime**: Bun
- **Language**: TypeScript 5.3+
- **Prompts**: @clack/prompts
- **CLI**: commander
- **Validation**: zod
- **Testing**: bun:test

## Project Structure
```
src/
  ├── index.ts              # #!/usr/bin/env bun entry point
  ├── cli.ts                # commander setup, orchestrates flow
  ├── config.ts             # zod validation schemas
  ├── constants.ts          # framework configs (ports, commands, labels)
  ├── types.ts              # type definitions
  ├── prompts/              # @clack/prompts interactive prompts
  │   ├── index.ts          # main prompt flow
  │   ├── project-name.ts   # project name prompt
  │   ├── project-type.ts   # stack type selection
  │   ├── backend.ts        # backend framework selection
  │   ├── frontend.ts       # frontend framework selection
  │   └── git.ts            # git init prompt
  ├── generator/            # template copy + {{var}} substitution
  │   ├── index.ts          # orchestrator, resolveTemplatePath
  │   ├── file-copier.ts    # recursive copy with var replacement
  │   └── template-engine.ts # variable substitution engine
  ├── commands/
  │   ├── index.ts
  │   └── create.ts         # create command handler
  ├── helpers/
  │   ├── index.ts
  │   └── git-init.ts       # git init per generated project
  └── utils/
      ├── index.ts
      ├── validate.ts       # project name validation
      ├── errors.ts         # error utilities
      ├── package-manager.ts # detect package manager
      └── command-exists.ts  # check if CLI tool exists

tests/
  ├── scaffold.test.ts   # file generation, var substitution
  └── templates.test.ts  # template validation

templates/
  ├── backends/
  │   ├── python-fastapi/
  │   ├── go-chi/
  │   ├── nestjs/
  │   └── rust-axum/
  └── frontends/
      ├── react-vite/
      ├── nextjs/
      └── angular/
```

## Build & Development

**Install dependencies**:
```bash
bun install
```

**Run CLI** (interactive mode):
```bash
bun run src/index.ts
```

**Run tests**:
```bash
bun test
```

**Type check**:
```bash
bun run build
```

## Coding Style

- **Files**: kebab-case (`cli.ts`, `git.ts`, `prompts.ts`)
- **Variables/functions**: camelCase (`projectName`, `getTemplatePath`)
- **Types/interfaces**: PascalCase (`ProjectType`, `ScaffoldConfig`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_PORT`)

## Template Authoring

### Adding a new framework template

1. Create dir: `templates/backends/my-framework/` or `templates/frontends/my-framework/`
2. Add type union in `src/types.ts`:
   ```typescript
   type BackendFramework = "python-fastapi" | "go-chi" | "nestjs" | "rust-axum" | "my-framework";
   ```
3. Add prompt option in `src/prompts.ts` (backend or frontend selection)
4. Generator (`src/generator.ts`) handles copy + substitution automatically

### Template files

Each template must include:
- Core app files (main.ts, main.py, main.go, etc.)
- Configuration (`package.json`, `pyproject.toml`, `go.mod`, etc.)
- `.gitignore`, `README.md`, `CLAUDE.md`
- `.env.example` with required env vars

### Template variables

Two variables available for substitution:
- `{{projectName}}` — folder name (e.g. `my-app-backend`)
- `{{baseName}}` — root project name (e.g. `my-app`)

Used in: `package.json`, `go.mod`, `pyproject.toml`, `README.md`, app source files, etc.

## Testing (3-tier approach)

### Tier 1: Scaffold tests (every commit, <1 min)
- File generation correctness
- Variable substitution works
- Git initialization succeeds
- **File**: `tests/scaffold.test.ts`

### Tier 2: Template validation (every PR, 2-3 min)
- Template files parse correctly (JSON, TOML, YAML)
- No leftover `{{` markers
- Required endpoints present in source
- **File**: `tests/templates.test.ts`

### Tier 3: Server startup (scheduled/manual, 15-30 min)
- Install deps for generated project
- Start server
- Verify `GET /health` returns 200
- (Implemented in CI/CD, not bun:test)

## Type System

Key types in `src/types.ts`:
```typescript
type ProjectType = "backend" | "frontend";
type BackendFramework = "python-fastapi" | "go-chi" | "nestjs" | "rust-axum";
type FrontendFramework = "react-vite" | "nextjs" | "angular";

interface ProjectSelection {
  type: ProjectType;
  framework: string;
  folderName: string;
}

interface ScaffoldConfig {
  projectName: string;
  projects: ProjectSelection[];
  outputDir: string;
  initGit: boolean;
}
```

## Commits

Use conventional commits with scope:
```
feat(cli): add multi-select prompt for project types
fix(templates): correct CORS configuration in FastAPI
feat(generator): implement {{var}} substitution
test(scaffold): add file generation tests
docs(readme): update installation steps
```

Scopes:
- `cli` — CLI core (prompts, commands, orchestration)
- `templates` — template files or authoring logic
- `generator` — file copy, substitution, git init
- `tests` — test coverage
- `docs` — documentation, README
- `config` — tsconfig, package.json, etc.

## Key Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| Sibling folders, not monorepo | True project independence, separate git histories |
| File copy + `{{var}}` | Simple, debuggable, no template engine dependency |
| Templates in-repo | v1 simplicity, works locally |
| Bun runtime | Fast, TypeScript-native, esbuild-based bundling |
| Rust Axum included | Axum 0.8 + tokio, strict clippy::pedantic lints |

## Extensibility

The generator is generic — adding new frameworks requires only:
1. Template directory
2. Type union update
3. Prompt option

No changes to `src/generator.ts` needed.

## Generated Projects

Each scaffolded project includes a stack-specific `CLAUDE.md`:
- Python FastAPI: Python 3.12+, uv, async, pydantic-settings
- Go Chi: Go 1.22+, Chi v5, slog, caarlos0/env
- NestJS: NestJS 10, Pino, @nestjs/config + Joi
- Rust Axum: Rust 2021, Axum 0.8, tokio, tracing, thiserror
- React Vite: React 19, Vite 7, Tailwind v4, Vitest
- Next.js: Next.js 15, React 19, tRPC v11, Tailwind v4
- Angular: Angular 19, Tailwind v4, Vitest + @analogjs

This makes generated projects AI-ready from day one.
