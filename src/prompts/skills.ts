/**
 * Skills selection prompt (multiselect)
 * Dynamically builds options based on selected frameworks
 */

import { multiselect, cancel, isCancel } from "@clack/prompts";
import { SKILL_CATALOG } from "../constants.js";
import type { SkillCatalogKey } from "../types.js";

/**
 * Build flat skill options from catalog based on framework identifiers
 * Always includes "common" skills + framework-specific skills
 */
function buildSkillOptions(
  backendFramework?: string,
  frontendFramework?: string
): Array<{ value: string; label: string; hint: string }> {
  const options: Array<{ value: string; label: string; hint: string }> = [];
  const seen = new Set<string>();

  const addSkills = (catalogKey: SkillCatalogKey, category: string) => {
    const skills = SKILL_CATALOG[catalogKey];
    if (!skills || skills.length === 0) return;

    for (const entry of skills) {
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);

      options.push({
        value: entry.id,
        label: entry.label,
        hint: `${category} — ${entry.hint}`,
      });
    }
  };

  if (backendFramework) {
    addSkills("common-backend", "General");
    addSkills(backendFramework as SkillCatalogKey, backendFramework);
  }

  if (frontendFramework) {
    addSkills("common-frontend", "General");
    addSkills(frontendFramework as SkillCatalogKey, frontendFramework);
  }

  return options;
}

/**
 * Prompt for skill selection (multiselect)
 * All skills pre-selected by default
 * Returns array of skill IDs
 */
export async function promptSkills(
  backendFramework?: string,
  frontendFramework?: string
): Promise<string[]> {
  const options = buildSkillOptions(backendFramework, frontendFramework);

  if (options.length === 0) {
    return [];
  }

  const userSkills = await multiselect({
    message: "Select skills for Claude integration (optional)",
    options,
    required: false,
  });

  if (isCancel(userSkills)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return userSkills as string[];
}
