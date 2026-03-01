/**
 * Package manager detection based on npm_config_user_agent
 * Enables framework-agnostic install command suggestions
 */

import type { PackageManager } from "../types.js";

/**
 * Detect which package manager was used to invoke the CLI
 * Falls back to npm if unable to detect
 */
export function detectPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent || "";
  if (userAgent.startsWith("pnpm")) return "pnpm";
  if (userAgent.startsWith("bun")) return "bun";
  return "npm";
}
