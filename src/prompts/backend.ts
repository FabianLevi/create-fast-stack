/**
 * Backend framework selection prompt
 */

import { select, cancel, isCancel } from "@clack/prompts";
import { BACKEND_FRAMEWORKS } from "../constants.js";
import type { BackendFramework } from "../types.js";

const VALID_BACKENDS = new Set<string>(Object.keys(BACKEND_FRAMEWORKS));

function isBackendFramework(value: string): value is BackendFramework {
  return VALID_BACKENDS.has(value);
}

/**
 * Prompt for backend framework selection
 * Returns selected framework or exits if cancelled
 */
export async function promptBackendFramework(): Promise<BackendFramework> {
  const backendOptions = Object.entries(BACKEND_FRAMEWORKS).map(
    ([id, meta]) => ({
      value: id,
      label: meta.label,
    })
  );

  const userBackendFramework = await select({
    message: "Backend framework:",
    options: backendOptions,
  });

  if (isCancel(userBackendFramework)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  const value = String(userBackendFramework);
  if (!isBackendFramework(value)) {
    cancel(`Invalid backend framework: ${value}`);
    process.exit(1);
  }

  return value;
}
