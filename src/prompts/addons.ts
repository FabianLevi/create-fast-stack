/**
 * Addon selection prompt (multi-select with groups)
 * Filters available addons by project type
 */

import { groupMultiselect, cancel, isCancel } from "@clack/prompts";
import { ADDON_METADATA } from "../constants.js";
import type { AddonName, AddonGroup, ProjectType } from "../types.js";

interface AddonOption {
  value: AddonName;
  label: string;
  hint: string;
}

/** Which addon groups are available per project type */
const ADDON_GROUPS_BY_TYPE: Record<ProjectType, AddonGroup[]> = {
  backend: ["ai"],
  frontend: ["tooling", "ai"],
};

/**
 * Organize addons into groups, filtered by project type
 */
function getAddonsByGroup(projectType: ProjectType): Record<string, AddonOption[]> {
  const allowedGroups = ADDON_GROUPS_BY_TYPE[projectType];
  const groups: Record<string, AddonOption[]> = {};

  for (const [id, metadata] of Object.entries(ADDON_METADATA)) {
    if (!allowedGroups.includes(metadata.group)) continue;

    const addonId = id as AddonName;
    const option: AddonOption = {
      value: addonId,
      label: metadata.name,
      hint: metadata.description,
    };

    if (!groups[metadata.group]) {
      groups[metadata.group] = [];
    }
    groups[metadata.group].push(option);
  }

  return groups;
}

/**
 * Prompt for addon selection (multi-select with groups)
 * Filters addons by project type (backend = AI only, frontend = all)
 * Returns array of selected addon IDs (can be empty)
 */
export async function promptAddons(projectType: ProjectType = "frontend"): Promise<AddonName[]> {
  const addonsByGroup = getAddonsByGroup(projectType);

  // Skip if no addons available for this type
  if (Object.keys(addonsByGroup).length === 0) {
    return [];
  }

  const userAddons = await groupMultiselect({
    message: "Select addons (optional)",
    options: addonsByGroup,
    required: false,
  });

  if (isCancel(userAddons)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return userAddons as AddonName[];
}
