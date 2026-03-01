/**
 * Package manager selection prompt
 */

import { select, cancel, isCancel } from "@clack/prompts";
import { PACKAGE_MANAGER } from "../constants.js";
import type { PackageManager } from "../types.js";

/**
 * Prompt for package manager selection
 * Returns "npm", "pnpm", or "bun"
 */
export async function promptPackageManager(): Promise<PackageManager> {
  const pmOptions = [
    {
      value: PACKAGE_MANAGER.BUN,
      label: "bun",
      hint: "Fast, all-in-one package manager",
    },
    {
      value: PACKAGE_MANAGER.PNPM,
      label: "pnpm",
      hint: "Fast, disk space efficient",
    },
    {
      value: PACKAGE_MANAGER.NPM,
      label: "npm",
      hint: "Default Node.js package manager",
    },
  ];

  const userPackageManager = await select({
    message: "Package manager:",
    options: pmOptions,
  });

  if (isCancel(userPackageManager)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return userPackageManager as PackageManager;
}
