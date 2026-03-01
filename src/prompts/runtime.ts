/**
 * Runtime environment selection prompt
 */

import { select, cancel, isCancel } from "@clack/prompts";
import { RUNTIME } from "../constants.js";
import type { Runtime } from "../types.js";

/**
 * Prompt for runtime selection
 * Returns "bun" or "node"
 */
export async function promptRuntime(): Promise<Runtime> {
  const runtimeOptions = [
    {
      value: RUNTIME.BUN,
      label: "Bun",
      hint: "Fast all-in-one JavaScript runtime",
    },
    {
      value: RUNTIME.NODE,
      label: "Node.js",
      hint: "Traditional JavaScript runtime",
    },
  ];

  const userRuntime = await select({
    message: "Runtime environment:",
    options: runtimeOptions,
  });

  if (isCancel(userRuntime)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return userRuntime as Runtime;
}
