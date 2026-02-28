/**
 * Project type selection prompt
 */

import { multiselect, cancel, isCancel } from "@clack/prompts";
import { PROJECT_TYPES } from "../constants.js";
import type { ProjectType } from "../types.js";

/**
 * Prompt for project types (Backend, Frontend)
 * Returns array of selected types or exits if cancelled
 */
export async function promptProjectTypes(): Promise<ProjectType[]> {
  const userSelectedTypes = await multiselect({
    message: "What do you want to create? (select all that apply)",
    options: PROJECT_TYPES.map((type) => ({
      value: type.value,
      label: type.label,
    })),
    required: true,
  });

  if (isCancel(userSelectedTypes)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return userSelectedTypes as ProjectType[];
}
