/**
 * Validation utilities for prompts and configuration
 * Provides standalone validation without Zod dependency for prompt validators
 */

/**
 * Validate project name without throwing
 * Returns error message if invalid, undefined if valid
 * Rules:
 * - Required, 1-255 characters
 * - Lowercase alphanumeric + hyphens only
 * - Cannot start or end with hyphen
 * - Allows single character names (e.g., "a")
 */
export function validateProjectName(name: string): string | undefined {
  if (!name || name.length < 1) {
    return "Project name required";
  }
  if (name.length > 255) {
    return "Project name too long";
  }
  if (!/^[a-z]([a-z0-9-]*[a-z0-9])?$/.test(name)) {
    return "Must be lowercase alphanumeric with hyphens, cannot start/end with hyphen";
  }
  return undefined; // valid
}
