/**
 * Framework metadata and configuration constants
 * Extracted from types.ts for separation of concerns
 */

import path, { dirname } from "path";
import { fileURLToPath } from "node:url";
import type {
  ProjectType,
  BackendFramework,
  FrontendFramework,
  FrameworkMeta,
  Runtime,
  PackageManager,
  ScaffoldMode,
  AddonName,
  AddonMetadata,
  AddonGroup,
  SkillEntry,
  McpServerEntry,
} from "./types.js";

// Resolved paths — single source of truth for template resolution
const __dirname = dirname(fileURLToPath(import.meta.url));
export const PKG_ROOT = path.join(__dirname, "..");
export const TEMPLATES_DIR = path.join(PKG_ROOT, "templates");

// Default configuration for --yes flag and programmatic API
export const DEFAULT_CONFIG = {
  projectName: "my-fast-app",
  backend: "python-fastapi" as BackendFramework,
  frontend: "react-vite" as FrontendFramework,
  initGit: true,
} as const;

// Project types available for scaffolding
export const PROJECT_TYPE = {
  BACKEND: "backend",
  FRONTEND: "frontend",
  // future: CLI: "cli", INFRA: "infra"
} as const;

// Backend framework identifiers
export const BACKEND_FRAMEWORK = {
  PYTHON_FASTAPI: "python-fastapi",
  GO_CHI: "go-chi",
  NESTJS: "nestjs",
  RUST_AXUM: "rust-axum",
  DOTNET_ASPNETCORE: "dotnet-aspnetcore",
} as const;

// Frontend framework identifiers
export const FRONTEND_FRAMEWORK = {
  REACT_VITE: "react-vite",
  NEXTJS: "nextjs",
  ANGULAR: "angular",
  SVELTE: "svelte",
} as const;

/**
 * Backend framework metadata
 * All backends run on port 8000 by default (configurable via .env)
 */
export const BACKEND_FRAMEWORKS: Record<BackendFramework, FrameworkMeta> = {
  [BACKEND_FRAMEWORK.PYTHON_FASTAPI]: {
    id: BACKEND_FRAMEWORK.PYTHON_FASTAPI,
    label: "Python (FastAPI)",
    type: PROJECT_TYPE.BACKEND as ProjectType,
    defaultPort: 8000,
    installCommand: "uv sync",
    devCommand: "uv run python -m api.main",
  },
  [BACKEND_FRAMEWORK.GO_CHI]: {
    id: BACKEND_FRAMEWORK.GO_CHI,
    label: "Go (Chi)",
    type: PROJECT_TYPE.BACKEND as ProjectType,
    defaultPort: 8000,
    installCommand: "go mod download",
    devCommand: "go run cmd/api/main.go",
  },
  [BACKEND_FRAMEWORK.NESTJS]: {
    id: BACKEND_FRAMEWORK.NESTJS,
    label: "NestJS",
    type: PROJECT_TYPE.BACKEND as ProjectType,
    defaultPort: 8000,
    installCommand: "npm install",
    devCommand: "npm run start:dev",
  },
  [BACKEND_FRAMEWORK.RUST_AXUM]: {
    id: BACKEND_FRAMEWORK.RUST_AXUM,
    label: "Rust (Axum)",
    type: PROJECT_TYPE.BACKEND as ProjectType,
    defaultPort: 8000,
    installCommand: "cargo build",
    devCommand: "cargo run",
  },
  [BACKEND_FRAMEWORK.DOTNET_ASPNETCORE]: {
    id: BACKEND_FRAMEWORK.DOTNET_ASPNETCORE,
    label: "C# (ASP.NET Core)",
    type: PROJECT_TYPE.BACKEND as ProjectType,
    defaultPort: 8000,
    installCommand: "dotnet restore",
    devCommand: "dotnet run",
  },
};

/**
 * Frontend framework metadata
 * Vite apps default to 5173, Next.js defaults to 3000
 */
export const FRONTEND_FRAMEWORKS: Record<FrontendFramework, FrameworkMeta> = {
  [FRONTEND_FRAMEWORK.REACT_VITE]: {
    id: FRONTEND_FRAMEWORK.REACT_VITE,
    label: "React (Vite)",
    type: PROJECT_TYPE.FRONTEND as ProjectType,
    defaultPort: 5173,
    installCommand: "pnpm install",
    devCommand: "pnpm dev",
  },
  [FRONTEND_FRAMEWORK.NEXTJS]: {
    id: FRONTEND_FRAMEWORK.NEXTJS,
    label: "Next.js",
    type: PROJECT_TYPE.FRONTEND as ProjectType,
    defaultPort: 3000,
    installCommand: "pnpm install",
    devCommand: "pnpm dev",
  },
  [FRONTEND_FRAMEWORK.ANGULAR]: {
    id: FRONTEND_FRAMEWORK.ANGULAR,
    label: "Angular 19",
    type: PROJECT_TYPE.FRONTEND as ProjectType,
    defaultPort: 4200,
    installCommand: "pnpm install",
    devCommand: "pnpm start",
  },
  [FRONTEND_FRAMEWORK.SVELTE]: {
    id: FRONTEND_FRAMEWORK.SVELTE,
    label: "SvelteKit",
    type: PROJECT_TYPE.FRONTEND as ProjectType,
    defaultPort: 5173,
    installCommand: "pnpm install",
    devCommand: "pnpm dev",
  },
};

/**
 * Project type options for multi-select prompt
 */
export const PROJECT_TYPES: Array<{ value: ProjectType; label: string }> = [
  { value: PROJECT_TYPE.BACKEND, label: "Backend" },
  { value: PROJECT_TYPE.FRONTEND, label: "Frontend" },
];

/**
 * Project types shown in prompt but not yet implemented
 */
export const COMING_SOON_TYPES: Array<{ value: string; label: string }> = [
  { value: "infrastructure", label: "Infrastructure" },
  { value: "cli", label: "CLI" },
];

/**
 * Runtime environment options
 */
export const RUNTIME = {
  BUN: "bun",
  NODE: "node",
} as const satisfies Record<string, Runtime>;

/**
 * Package manager options
 */
export const PACKAGE_MANAGER = {
  NPM: "npm",
  PNPM: "pnpm",
  BUN: "bun",
} as const satisfies Record<string, PackageManager>;

/**
 * Scaffold mode options
 */
export const SCAFFOLD_MODE = {
  SCAFFOLD: "scaffold",
  CUSTOM: "custom",
} as const satisfies Record<string, ScaffoldMode>;

/**
 * Addon identifiers and ordering
 */
export const ADDON_NAME = {
  BIOME: "biome",
  HUSKY: "husky",
  SKILLS: "skills",
  MCP: "mcp",
} as const satisfies Record<string, AddonName>;

/**
 * Addon metadata: descriptions, dependencies, scripts, config files
 * Used by prompts (display + filtering) and addon-injector (installation)
 */
export const ADDON_METADATA: Record<AddonName, AddonMetadata> = {
  [ADDON_NAME.BIOME]: {
    id: ADDON_NAME.BIOME,
    name: "Biome",
    group: "tooling" as AddonGroup,
    description: "Fast, unified formatter and linter for JavaScript, JSON, and other languages",
    devDependencies: {
      "@biomejs/biome": "^1.9.4",
    },
    scripts: {
      lint: "biome lint .",
      format: "biome format .",
    },
    configFiles: ["biome.json"],
  },
  [ADDON_NAME.HUSKY]: {
    id: ADDON_NAME.HUSKY,
    name: "Husky",
    group: "tooling" as AddonGroup,
    description: "Git hooks made easy (commit, push, pre-flight checks)",
    devDependencies: {
      husky: "^9.1.7",
      "lint-staged": "^16.1.2",
    },
    scripts: {
      prepare: "husky",
    },
    configFiles: [".husky/pre-commit", ".lintstagedrc"],
  },
  [ADDON_NAME.SKILLS]: {
    id: ADDON_NAME.SKILLS,
    name: "Skills",
    group: "ai" as AddonGroup,
    description: "Claude Code skills for your framework",
    devDependencies: {},
    scripts: {},
    configFiles: [],
  },
  [ADDON_NAME.MCP]: {
    id: ADDON_NAME.MCP,
    name: "MCP",
    group: "ai" as AddonGroup,
    description: "MCP servers for enhanced AI context",
    devDependencies: {},
    scripts: {},
    configFiles: [".claude/mcp.json"],
  },
} as const satisfies Record<AddonName, AddonMetadata>;

/**
 * MCP server catalog: available MCP servers for selection
 */
export const MCP_CATALOG: McpServerEntry[] = [
  {
    id: "context7",
    label: "Context7",
    hint: "Up-to-date library docs for AI assistants",
    command: "npx",
    args: ["-y", "@upstash/context7-mcp@latest"],
  },
];

/**
 * Default scaffold configuration for frontend projects
 */
export const DEFAULT_SCAFFOLD_CONFIG = {
  runtime: RUNTIME.BUN as Runtime,
  packageManager: PACKAGE_MANAGER.PNPM as PackageManager,
  scaffoldMode: SCAFFOLD_MODE.SCAFFOLD as ScaffoldMode,
  addons: [] as AddonName[],
} as const;

/**
 * Skill catalog: curated skills for each framework
 * Maps framework identifiers to arrays of SkillEntry
 */
/**
 * Skills directory inside this package (bundled SKILL.md files)
 */
export const SKILLS_DIR = path.join(PKG_ROOT, "skills");

export const SKILL_CATALOG: Record<string, SkillEntry[]> = {
  "common-backend": [
    {
      id: "github-pr",
      label: "GitHub PR",
      hint: "Conventional commits and PR best practices",
    },
  ],
  "common-frontend": [
    {
      id: "web-design-guidelines",
      label: "Web Design Guidelines",
      hint: "UI audit with 100+ best practice rules",
    },
    {
      id: "github-pr",
      label: "GitHub PR",
      hint: "Conventional commits and PR best practices",
    },
    {
      id: "agent-browser",
      label: "Agent Browser",
      hint: "Browser automation for testing, screenshots, and data extraction",
    },
  ],
  "go-chi": [
    {
      id: "golang-pro",
      label: "Go Pro",
      hint: "Go best practices from effective go",
    },
  ],
  "rust-axum": [
    {
      id: "rust-engineer",
      label: "Rust Engineer",
      hint: "Rust idioms, safety, error handling",
    },
  ],
  nestjs: [
    {
      id: "nestjs-expert",
      label: "NestJS Expert",
      hint: "Scalable NestJS with design patterns",
    },
    {
      id: "typescript",
      label: "TypeScript",
      hint: "Strict patterns, utility types, naming conventions",
    },
  ],
  "dotnet-aspnetcore": [],
  "python-fastapi": [
    {
      id: "fastapi",
      label: "FastAPI",
      hint: "Official FastAPI patterns and best practices",
    },
    {
      id: "pytest",
      label: "Pytest",
      hint: "Fixtures, mocking, markers, test patterns",
    },
  ],
  "react-vite": [
    {
      id: "react-best-practices",
      label: "React Best Practices",
      hint: "React 19 optimization (40+ rules)",
    },
    {
      id: "composition-patterns",
      label: "Composition Patterns",
      hint: "Component refactoring patterns",
    },
    {
      id: "tailwind-4",
      label: "Tailwind CSS 4",
      hint: "Tailwind v4 patterns and best practices",
    },
  ],
  nextjs: [
    {
      id: "next-best-practices",
      label: "Next.js Best Practices",
      hint: "Next.js 15 App Router patterns",
    },
    {
      id: "tailwind-4",
      label: "Tailwind CSS 4",
      hint: "Tailwind v4 patterns and best practices",
    },
  ],
  angular: [
    {
      id: "angular",
      label: "Angular",
      hint: "Angular 19+ core, forms, architecture, performance",
    },
  ],
  svelte: [
    {
      id: "svelte",
      label: "SvelteKit",
      hint: "SvelteKit runes, routing, SSR, form actions",
    },
    {
      id: "tailwind-4",
      label: "Tailwind CSS 4",
      hint: "Tailwind v4 patterns and best practices",
    },
  ],
} as const;
