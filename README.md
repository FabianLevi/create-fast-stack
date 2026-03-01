# create-fast-stack

A polyglot CLI scaffolder for spinning up production-ready full-stack projects in seconds. Pick your backend language, pick your frontend framework — get independent, deployable projects with best practices baked in.

## Philosophy

- **Polyglot by design**: Mix any backend language with any frontend framework.
- **Independent projects**: Sibling folders with separate git repos, not a monorepo.
- **AI-ready from day one**: Every generated project includes a stack-specific `CLAUDE.md`.
- **Minimal templates**: Zero bloat — each project runs immediately after scaffolding.

## Quick Start

```bash
# Using bun (recommended)
bunx create-fast-stack@latest

# Using npx
npx create-fast-stack@latest

# Or run from source
git clone https://github.com/FabianLevi/create-fast-stack.git
cd create-fast-stack
bun install
bun run dev
```

## Features

- **Backends**: Python (FastAPI), Go (Chi), NestJS, Rust (Axum)
- **Frontends**: React (Vite), Next.js, Angular 19
- **Runtime**: Bun or Node.js
- **Package Manager**: npm, pnpm, or bun
- **Addons**: Biome, Husky + lint-staged, Claude Skills, MCP servers
- **AI tooling**: Framework-specific Claude skills bundled per project
- **Templates**: Handlebars-powered dynamic `CLAUDE.md`, `README.md`, and config files

Every backend exposes `GET /health` with CORS pre-configured. Every frontend fetches and displays the backend status on load.

## Supported Stacks

| Backend | Language | Frontend | Framework |
|---------|----------|----------|-----------|
| FastAPI | Python 3.12+ | React + Vite | React 19, Tailwind v4, Vitest |
| Chi | Go 1.22+ | Next.js | Next 15, tRPC v11, Tailwind v4 |
| NestJS | TypeScript | Angular | Angular 19, Tailwind v4, Vitest |
| Axum | Rust 2021 | | |

Mix and match — any backend with any frontend.

## Addons

| Addon | Description |
|-------|-------------|
| Biome | Fast, unified formatter and linter |
| Husky | Git hooks with lint-staged pre-commit |
| Skills | Framework-specific Claude Code skills |
| MCP | MCP servers for enhanced AI context (Context7) |

## Output Structure

Projects are created as independent sibling folders:

```
my-app/
├── my-app-backend/          # Independent git repo
│   ├── src/
│   ├── CLAUDE.md            # Stack-specific AI instructions
│   ├── .env.example
│   └── README.md
└── my-app-frontend/         # Independent git repo
    ├── src/
    ├── CLAUDE.md            # Stack-specific AI instructions
    ├── .env.example
    └── README.md
```

