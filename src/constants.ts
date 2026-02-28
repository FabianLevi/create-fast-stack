/**
 * Framework metadata and configuration constants
 * Extracted from types.ts for separation of concerns
 */

import path from "path";
import type { ProjectType, BackendFramework, FrontendFramework, FrameworkMeta } from "./types.js";

// Resolved paths — single source of truth for template resolution
export const PKG_ROOT = path.join(import.meta.dir, "..");
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
} as const;

// Frontend framework identifiers
export const FRONTEND_FRAMEWORK = {
  REACT_VITE: "react-vite",
  NEXTJS: "nextjs",
  ANGULAR: "angular",
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
