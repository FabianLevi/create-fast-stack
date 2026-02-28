/**
 * Frontend framework selection prompt
 */

import { select, cancel, isCancel } from "@clack/prompts";
import { FRONTEND_FRAMEWORKS } from "../constants.js";
import type { FrontendFramework } from "../types.js";

/**
 * Prompt for frontend framework selection
 * Returns selected framework or exits if cancelled
 */
export async function promptFrontendFramework(): Promise<FrontendFramework> {
  const frontendOptions = Object.entries(FRONTEND_FRAMEWORKS).map(
    ([id, meta]) => ({
      value: id,
      label: meta.label,
    })
  );

  const userFrontendFramework = await select({
    message: "Frontend framework:",
    options: frontendOptions,
  });

  if (isCancel(userFrontendFramework)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return userFrontendFramework as FrontendFramework;
}
