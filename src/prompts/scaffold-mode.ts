/**
 * Scaffold mode selection prompt (scaffold vs custom)
 */

import { select, cancel, isCancel } from "@clack/prompts";
import { SCAFFOLD_MODE } from "../constants.js";
import type { ScaffoldMode } from "../types.js";

/**
 * Prompt for scaffold mode selection
 * Returns "scaffold" (quick defaults) or "custom" (configure everything)
 */
export async function promptScaffoldMode(): Promise<ScaffoldMode> {
  const modeOptions = [
    {
      value: SCAFFOLD_MODE.SCAFFOLD,
      label: "Scaffold (Recommended)",
      hint: "Quick setup with sensible defaults",
    },
    {
      value: SCAFFOLD_MODE.CUSTOM,
      label: "Custom",
      hint: "Configure options and AI skills",
    },
  ];

  const userScaffoldMode = await select({
    message: "How do you want to configure this project?",
    options: modeOptions,
  });

  if (isCancel(userScaffoldMode)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return userScaffoldMode as ScaffoldMode;
}
