# create-fast-stack

A polyglot CLI scaffolder that generates independent, production-ready projects with separate git repos. Choose your backend (Python, Go, Node) and frontend (React, Next.js) — get a fully wired stack in seconds.

## Features

- **Polyglot backends**: Python (FastAPI), Go (Fiber), NestJS
- **Modern frontends**: React (Vite), Next.js
- **Independent projects**: Each backend and frontend is a separate git repo with isolated dependencies
- **Pre-wired connectivity**: Backend exposes `/hello` endpoint, frontend automatically fetches and displays response on load
- **AI-ready**: Each generated project includes stack-specific `CLAUDE.md` for seamless AI-assisted development
- **Beautiful CLI**: Interactive prompts with @clack/prompts for a polished user experience
- **Zero boilerplate**: Minimal, working starters — no bloat, everything runs immediately

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/create-fast-stack.git
cd create-fast-stack
bun install
bun run dev
```

Then follow the interactive prompts to select your stack.

## Usage

Run the CLI:

```bash
bun run dev
```

You'll be guided through these steps:

```
┌ Create Fast Stack
│
◇ Project name:
│ my-app
│
◆ What do you want to create? (select all that apply)
│ ◻ Backend
│ ◻ Frontend
│
◆ Backend framework: (if Backend selected)
│ ○ Python (FastAPI)
│ ○ Go (Fiber)
│ ○ NestJS
│
◆ Frontend framework: (if Frontend selected)
│ ○ React (Vite)
│ ○ Next.js
│
◇ Projects will be created as:
│   my-app-backend/
│   my-app-frontend/
│ ○ Yes, looks good
│ ○ No, let me customize names
│
◆ Initialize git in each project?
│ ○ Yes (separate git repo per project)
│ ○ No
│
└ Done! Created my-app-backend + my-app-frontend
```

## Output Structure

Your projects are created as independent sibling folders:

```
my-app/                           # Parent folder (no git)
├── my-app-backend/               # Independent git repo
│   ├── main.py                   # or main.go / src/main.ts
│   ├── package.json / pyproject.toml / go.mod
│   ├── CLAUDE.md
│   ├── .env.example
│   ├── .gitignore
│   └── README.md
└── my-app-frontend/              # Independent git repo
    ├── package.json
    ├── src/
    │   ├── App.tsx / page.tsx
    │   └── main.tsx / layout.tsx
    ├── CLAUDE.md
    ├── .env.example
    ├── .gitignore
    └── README.md
```

## Supported Stacks

| Backend | Frontend | Backend Port | Frontend Port |
|---------|----------|--------------|---------------|
| Python (FastAPI) | React (Vite) | 8000 | 5173 |
| Python (FastAPI) | Next.js | 8000 | 3000 |
| Go (Fiber) | React (Vite) | 8000 | 5173 |
| Go (Fiber) | Next.js | 8000 | 3000 |
| NestJS | React (Vite) | 8000 | 5173 |
| NestJS | Next.js | 8000 | 3000 |

All backends expose:
- `GET /health` — Health check endpoint
- `GET /hello` — Returns `{ "message": "Hello from <framework>!" }`

All backends have CORS enabled for both `localhost:5173` (Vite) and `localhost:3000` (Next.js).

## Template Variables

During scaffolding, two variables are substituted in all template files:

| Variable | Value | Example |
|----------|-------|---------|
| `{{projectName}}` | Full project folder name | `my-app-backend` |
| `{{baseName}}` | Root project name | `my-app` |

Examples of substitution:

```json
// package.json
{
  "name": "{{projectName}}"    // becomes "my-app-backend"
}

// README.md
# {{projectName}}              // becomes "# my-app-backend"

// App.tsx
<h1>{{baseName}}</h1>         // becomes "<h1>my-app</h1>"
```

## Adding a New Framework

Extensibility is built in. To add a new backend or frontend framework:

1. **Create a template directory** under `templates/backends/` or `templates/frontends/`:
   ```bash
   mkdir -p templates/backends/my-framework
   ```

2. **Add framework files** (include `CLAUDE.md`, `.env.example`, `.gitignore`):
   - Backend: `main.ts` (or equivalent), package.json, setup files
   - Frontend: `App.tsx` (or equivalent), package.json, setup files

3. **Update the framework union types** in `src/types.ts`:
   ```typescript
   export type BackendFramework = "python-fastapi" | "go-fiber" | "nestjs" | "my-framework";
   ```

4. **Add an option in** `src/prompts/backend.ts` or `src/prompts/frontend.ts`:
   ```typescript
   {
     value: "my-framework",
     label: "My Framework"
   }
   ```

The generator is generic — no code changes needed beyond the above.

## Development

### Commands

```bash
# Run the CLI in development
bun run dev

# Run all tests (Tier 1: unit, Tier 2: template validation)
bun test

# Type check
bun run build
```

### Testing Strategy

Three-tier testing approach:

| Tier | When | Duration | What |
|------|------|----------|------|
| 1. Scaffold | Every commit | <1 sec | File generation, variable substitution, git init |
| 2. Template Validation | Every PR | ~2-3 sec | Endpoint definitions exist, dependency files parse, no leftover `{{` |
| 3. Server Startup | Scheduled | ~15-30 min | Install deps → start server → verify `/health` → 200 OK |

Run Tier 1 & 2: `bun test`

### Project Structure

```
src/
├── index.ts                 # CLI entry point
├── cli.ts                   # Commander program setup
├── types.ts                 # Type definitions
├── config.ts                # Zod validation schemas
├── constants.ts             # Constants (frameworks, etc.)
├── commands/
│   └── create.ts            # Create command handler
├── prompts/                 # Interactive prompt flows
│   ├── index.ts
│   ├── project-name.ts
│   ├── project-type.ts
│   ├── backend.ts
│   ├── frontend.ts
│   └── git.ts
├── generator/               # Template copying & substitution
│   ├── index.ts
│   ├── file-copier.ts
│   └── template-engine.ts
├── helpers/                 # Utility functions
│   ├── git-init.ts
│   └── index.ts
└── utils/                   # Generic utilities
    ├── index.ts
    ├── validate.ts
    ├── errors.ts
    ├── command-exists.ts
    └── package-manager.ts

tests/
├── scaffold.test.ts         # Tier 1: unit tests
└── templates.test.ts        # Tier 2: template validation

templates/
├── backends/
│   ├── python-fastapi/      # FastAPI + uvicorn
│   ├── go-fiber/            # Fiber framework
│   └── nestjs/              # NestJS + Express
└── frontends/
    ├── react-vite/          # React + Vite
    └── nextjs/              # Next.js
```

## Roadmap

### v2: Granular Framework Options

After selecting a framework, drill into sub-options per framework:

**Frontend**:
- Router: TanStack Router, React Router, Remix
- Runtime: Bun, Node
- Styling: Tailwind, CSS Modules, Vanilla Extract
- State: Zustand, Redux, Jotai, React Query
- Auth: Better Auth, Clerk, NextAuth
- API: tRPC, oRPC, gRPC-web

**Backend**:
- Database: PostgreSQL, MySQL, SQLite
- ORM: Prisma, Drizzle, SQLAlchemy
- Auth: Better Auth, Passport, FastAPI-Users
- Testing: Pytest (Python), Jest (Node), Go test

### Future Project Types

- **CLI**: Standalone command-line tools
- **Infrastructure**: Docker, CI/CD, Terraform templates

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Sibling folders over monorepo | True independence: separate git histories, deploy cycles, dependencies |
| File copy + `{{var}}` | No template engine dependency, simple, debuggable, works everywhere |
| @clack/prompts + commander | Beautiful UX (clack) + robust CLI parsing (commander) |
| In-repo templates | v1 simplicity, no registry overhead |
| Minimal starters | Low friction, each template runs immediately without setup |
| All backends on port 8000 | Standardized, configurable via `.env` if port conflict |
| Python uses uv, not pip | Faster, modern, handles venvs automatically |
| No Rust (Axum) in v1 | Slow builds (5-10 min), complicates CI, can add later |

## Distribution

**v1**: Clone from GitHub and run with Bun.

**Future**: Publish to npm as `create-fast-stack` for `npx create-fast-stack` support.

## License

MIT

---

Ready to build faster? Clone the repo and run `bun run dev` to get started.
