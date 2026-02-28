/**
 * Type definitions for create-fast-stack CLI
 * Type definitions only — constants moved to constants.ts
 */

// Project types available for scaffolding
export type ProjectType = "backend" | "frontend";

// Backend framework identifiers
export type BackendFramework = "python-fastapi" | "go-chi" | "nestjs" | "rust-axum";

// Frontend framework identifiers
export type FrontendFramework = "react-vite" | "nextjs" | "angular";

/**
 * Framework metadata for prompts and post-scaffold output
 */
export interface FrameworkMeta {
  id: string;
  label: string;
  type: ProjectType;
  defaultPort: number;
  installCommand: string;
  devCommand: string;
}

// Re-export schema-derived types from config.ts
export type { ProjectSelection, ScaffoldConfig } from "./config.js";

// Re-export generator types
export type { TemplateVars } from "./generator/file-copier.js";

// Re-export constants for backward compatibility (constants moved to constants.ts)
export {
  PROJECT_TYPE,
  BACKEND_FRAMEWORK,
  FRONTEND_FRAMEWORK,
  BACKEND_FRAMEWORKS,
  FRONTEND_FRAMEWORKS,
  PROJECT_TYPES,
} from "./constants.js";
