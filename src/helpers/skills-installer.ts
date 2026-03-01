/**
 * Skills installation: copies bundled SKILL.md files into project .claude/skills/
 */

import { promises as fs } from "fs";
import path from "path";
import { spinner, log } from "@clack/prompts";
import { SKILLS_DIR } from "../constants.js";

/**
 * Recursively copy a directory
 */
async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Install skills by copying from bundled skills/ directory
 * into each project's .claude/skills/{skill-id}/
 * Supports both flat skills (SKILL.md) and nested skills (sub-dirs with SKILL.md)
 */
export async function installSkills(
  projectPaths: string[],
  skillIds: string[]
): Promise<void> {
  if (!skillIds || skillIds.length === 0) {
    return;
  }

  const s = spinner();
  s.start("Installing skills");

  try {
    for (const skillId of skillIds) {
      const srcDir = path.join(SKILLS_DIR, skillId);

      try {
        await fs.access(srcDir);
      } catch {
        log.warn(`Skill "${skillId}" not found in bundled skills — skipping`);
        continue;
      }

      for (const projectPath of projectPaths) {
        const destDir = path.join(projectPath, ".claude", "skills", skillId);
        await copyDir(srcDir, destDir);
      }
    }

    s.stop("Skills installed");
  } catch (error) {
    if (error instanceof Error) {
      log.warn(`Skills installation error: ${error.message}`);
    } else {
      log.warn("Skills installation encountered an error");
    }
    s.stop("Skills installation had issues (continuing)");
  }
}
