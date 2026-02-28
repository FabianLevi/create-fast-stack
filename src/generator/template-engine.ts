/**
 * Template engine: resolution and generation orchestration
 */

import path from "path";
import { spinner } from "@clack/prompts";
import type { ProjectType, ScaffoldConfig } from "../types.js";
import { TEMPLATES_DIR } from "../constants.js";
import { copyTemplate, type TemplateVars } from "./file-copier.js";

/**
 * Resolve template directory path for a given project type and framework
 */
export function resolveTemplatePath(type: ProjectType, framework: string): string {
  const templateDir =
    type === "backend" ? "backends" : "frontends";
  return path.join(TEMPLATES_DIR, templateDir, framework);
}

/**
 * Generate all projects for a scaffold configuration
 */
export async function generateProjects(
  config: ScaffoldConfig,
  parentPath: string
): Promise<void> {
  const s = spinner();
  s.start("Generating projects");

  try {
    for (const project of config.projects) {
      const projectPath = path.join(parentPath, project.folderName);

      const templatePath = resolveTemplatePath(
        project.type,
        project.framework
      );

      const vars: TemplateVars = {
        projectName: project.folderName,
        baseName: config.projectName,
      };

      await copyTemplate(templatePath, projectPath, vars);
    }

    s.stop("Projects generated");
  } catch (error) {
    s.stop("Failed to generate projects");
    throw error;
  }
}
