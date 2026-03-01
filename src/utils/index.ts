/**
 * Utilities barrel export
 */

export { ValidationError, GitError, ScaffoldError } from "./errors.js";
export { detectPackageManager } from "./package-manager.js";
export type { PackageManager } from "../types.js";
export { commandExists } from "./command-exists.js";
export { validateProjectName } from "./validate.js";

/**
 * Format stderr for consistent error messages
 * Handles Buffer, string, or undefined input
 */
export function formatStderr(stderr: Buffer | string | undefined): string {
  if (!stderr) return "Unknown error";
  return typeof stderr === "string" ? stderr.trim() : stderr.toString().trim();
}
