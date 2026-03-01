/**
 * Project type selection prompt
 */

import { cancel } from "@clack/prompts";
import { customMultiselect, isCancel } from "./custom-multiselect.js";
import { PROJECT_TYPES, COMING_SOON_TYPES } from "../constants.js";
import type { ProjectType } from "../types.js";

const VALID_PROJECT_TYPES = new Set<string>(PROJECT_TYPES.map((t) => t.value));

function isProjectType(value: string): value is ProjectType {
  return VALID_PROJECT_TYPES.has(value);
}

/**
 * Prompt for project types (Backend, Frontend)
 * Coming soon items shown as dimmed, non-selectable options
 */
export async function promptProjectTypes(): Promise<ProjectType[]> {
  const userSelectedTypes = await customMultiselect({
    message: "What do you want to create? (select all that apply)",
    options: [
      ...PROJECT_TYPES.map((type) => ({
        value: type.value,
        label: type.label,
      })),
      ...COMING_SOON_TYPES.map((type) => ({
        value: type.value,
        label: type.label,
        hint: "coming soon",
        disabled: true,
      })),
    ],
    required: true,
  });

  if (isCancel(userSelectedTypes)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  const selected = (userSelectedTypes as string[]).filter(isProjectType);
  if (selected.length === 0) {
    cancel("No valid project type selected.");
    process.exit(1);
  }

  return selected;
}
