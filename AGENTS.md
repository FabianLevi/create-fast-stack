# create-fast-stack — Agent Instructions (Vendor-Neutral)

Use these instructions with any AI assistant: Claude Code, Copilot, Cursor, etc.

## Project Overview

Polyglot CLI scaffolder (Bun + TypeScript) that generates independent projects in sibling folders with separate git repos. Supports multiple backends (Python FastAPI, Go Fiber, NestJS) and frontends (React Vite, Next.js).

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
  ├── index.ts           # #!/usr/bin/env bun entry point
  ├── cli.ts             # commander setup, orchestrates flow
  ├── prompts.ts         # @clack/prompts interactive prompts
  ├── config.ts          # zod validation schemas
  ├── generator.ts       # template copy + {{var}} substitution
  ├── git.ts             # git init per generated project
  └── types.ts           # type definitions

tests/
  ├── scaffold.test.ts   # file generation, var substitution
  └── templates.test.ts  # template validation

templates/
  ├── backends/
  │   ├── python-fastapi/
  │   ├── go-fiber/
  │   └── nestjs/
  └── frontends/
      ├── react-vite/
      └── nextjs/
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
   type BackendFramework = "python-fastapi" | "go-fiber" | "nestjs" | "my-framework";
   ```
3. Add prompt option in `src/prompts.ts` (backend or frontend selection)
4. Generator (`src/generator.ts`) handles copy + substitution automatically

### Template files

Each template must include:
- Core app files (main.ts, main.py, main.go, etc.)
- Configuration (`package.json`, `pyproject.toml`, `go.mod`, etc.)
- `.gitignore`, `README.md`, `CLAUDE.md` (or `AGENTS.md`)
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
type BackendFramework = "python-fastapi" | "go-fiber" | "nestjs";
type FrontendFramework = "react-vite" | "nextjs";

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
| No Rust (Axum) v1 | Slow builds, added complexity; can add later |

## Extensibility

The generator is generic — adding new frameworks requires only:
1. Template directory
2. Type union update
3. Prompt option

No changes to `src/generator.ts` needed.

## Generated Projects

Each scaffolded project includes a stack-specific CLAUDE.md or AGENTS.md:
- Python FastAPI: Python 3.12+, uv, async
- Go Fiber: Go 1.21+, standard tooling
- NestJS: Node 18+, npm, dependency injection
- React Vite: React 18, Vite, TypeScript
- Next.js: React 18, App Router, TypeScript

This makes generated projects AI-ready from day one.
