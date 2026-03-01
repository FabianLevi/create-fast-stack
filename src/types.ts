/**
 * Type definitions for create-fast-stack CLI
 * Type definitions only — constants moved to constants.ts
 */

// Project types available for scaffolding
export type ProjectType = "backend" | "frontend";

// Backend framework identifiers
export type BackendFramework = "python-fastapi" | "go-chi" | "nestjs" | "rust-axum" | "dotnet-aspnetcore";

// Frontend framework identifiers
export type FrontendFramework = "react-vite" | "nextjs" | "angular" | "svelte";

// Runtime environment identifiers
export type Runtime = "bun" | "node";

// Package manager identifiers
export type PackageManager = "npm" | "pnpm" | "bun";

// Scaffold mode selection
export type ScaffoldMode = "scaffold" | "custom";

// Addon identifiers
export type AddonName = "biome" | "husky" | "skills" | "mcp";

// Addon categories
export type AddonGroup = "tooling" | "ai";

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

/**
 * Addon metadata for prompt display and injection
 */
export interface AddonMetadata {
  id: AddonName;
  name: string;
  group: AddonGroup;
  description: string;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  configFiles: string[];
}

/**
 * Skill catalog entry for Claude skills
 */
export interface SkillEntry {
  id: string;
  label: string;
  hint: string;
}

/**
 * MCP server catalog entry
 */
export interface McpServerEntry {
  id: string;
  label: string;
  hint: string;
  command: string;
  args: string[];
}

/**
 * Template context for file generation and substitution
 */
export interface TemplateContext {
  projectName: string;
  baseName: string;
  framework: string;
  runtime: Runtime;
  packageManager: PackageManager;
  selectedAddons: AddonName[];
  isCustom: boolean;
}

/**
 * Frontend project selection with customization options
 */
export interface FrontendProjectSelection {
  type: "frontend";
  framework: FrontendFramework;
  folderName: string;
  scaffoldMode: ScaffoldMode;
  runtime?: Runtime;
  packageManager?: PackageManager;
  addons?: AddonName[];
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
  RUNTIME,
  PACKAGE_MANAGER,
  SCAFFOLD_MODE,
  ADDON_NAME,
  ADDON_METADATA,
  DEFAULT_SCAFFOLD_CONFIG,
} from "./constants.js";
