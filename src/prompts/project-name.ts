/**
 * Project name prompt
 */

import { text, cancel, isCancel } from "@clack/prompts";
import { validateProjectName } from "../utils/index.js";

/**
 * Prompt for project name
 * Returns project name or exits if cancelled
 */
export async function promptProjectName(
  initialValue?: string
): Promise<string> {
  if (initialValue) {
    return initialValue;
  }

  const userInput = await text({
    message: "Project name:",
    validate: (value) => {
      return validateProjectName(value);
    },
  });

  if (isCancel(userInput)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return userInput;
}
