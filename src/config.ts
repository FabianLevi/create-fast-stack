/**
 * Configuration schemas and validation using Zod
 * Handles project name validation, project selection, and complete scaffold config
 */

import { z } from "zod";
import { PROJECT_TYPE } from "./constants.js";
import { validateProjectName as validateProjectNameUtil } from "./utils/index.js";

/**
 * Project name validation
 * Rules:
 * - Required, 1-255 characters
 * - Lowercase alphanumeric + hyphens only
 * - Cannot start or end with hyphen
 * - Allows single character names (e.g., "a")
 */
export const projectNameSchema = z
  .string()
  .min(1, { error: "Project name required" })
  .max(255, { error: "Project name too long" })
  .refine(
    (name) => /^[a-z]([a-z0-9-]*[a-z0-9])?$/.test(name),
    { message: "Must be lowercase alphanumeric with hyphens, cannot start/end with hyphen" }
  );

/**
 * Single project selection within a scaffold
 */
export const projectSelectionSchema = z.object({
  type: z.enum([PROJECT_TYPE.BACKEND, PROJECT_TYPE.FRONTEND]),
  framework: z.string(),
  folderName: z.string(),
});

/**
 * Complete scaffold configuration
 */
export const scaffoldConfigSchema = z.object({
  projectName: projectNameSchema,
  projects: z
    .array(projectSelectionSchema)
    .min(1, { error: "Select at least one project type" }),
  outputDir: z.string(),
  initGit: z.boolean(),
});

/**
 * Validate a project name with Zod schema
 * Throws if invalid — wraps utility function
 */
export function validateProjectName(name: string): string {
  const error = validateProjectNameUtil(name);
  if (error) {
    throw new Error(error);
  }
  return name;
}

/** Types inferred from schemas — single source of truth */
export type ProjectSelection = z.infer<typeof projectSelectionSchema>;
export type ScaffoldConfig = z.infer<typeof scaffoldConfigSchema>;

/**
 * Validate complete scaffold configuration
 * Throws if invalid
 */
export function validateConfig(config: unknown): ScaffoldConfig {
  return scaffoldConfigSchema.parse(config);
}
