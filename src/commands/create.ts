/**
 * Create command: main scaffolding orchestration
 * Handles project creation from config through git initialization
 */

import { existsSync, mkdirSync, rmSync } from "fs";
import path from "path";
import { log, note, outro } from "@clack/prompts";
import { collectConfig } from "../prompts/index.js";
import { generateProjects } from "../generator/index.js";
import { initGitForProjects } from "../helpers/index.js";
import {
  BACKEND_FRAMEWORKS,
  FRONTEND_FRAMEWORKS,
  PROJECT_TYPE,
} from "../constants.js";
import type { ScaffoldConfig, ProjectSelection, FrameworkMeta } from "../types.js";
import { detectPackageManager } from "../utils/index.js";

/**
 * Resolve framework metadata from a project selection
 */
function getFrameworkMeta(project: ProjectSelection): FrameworkMeta | undefined {
  if (project.type === PROJECT_TYPE.BACKEND) {
    return BACKEND_FRAMEWORKS[project.framework as keyof typeof BACKEND_FRAMEWORKS];
  }
  return FRONTEND_FRAMEWORKS[project.framework as keyof typeof FRONTEND_FRAMEWORKS];
}

/**
 * Print post-scaffold summary with framework-specific next steps
 */
function printNextSteps(config: ScaffoldConfig, _parentPath: string): void {
  outro(`Done! Created ${config.projectName}/`);

  const steps: string[] = [];
  const pkgManager = detectPackageManager();

  for (const project of config.projects) {
    const meta = getFrameworkMeta(project);
    if (!meta) continue;

    const projectPath = path.join(config.projectName, project.folderName);
    const typeLabel = project.type.charAt(0).toUpperCase() + project.type.slice(1);

    // For Node-based frameworks, use detected package manager command
    let installCmd = meta.installCommand;
    if ((project.framework === "nestjs" || project.framework === "react-vite" || project.framework === "nextjs") && pkgManager !== "npm") {
      installCmd = pkgManager === "pnpm" ? "pnpm install" : pkgManager === "bun" ? "bun install" : pkgManager === "yarn" ? "yarn install" : "npm install";
    }

    steps.push(`${typeLabel}:`);
    steps.push(`  cd ${projectPath}`);
    steps.push(`  ${installCmd} && ${meta.devCommand}`);
    steps.push("");
  }

  // Connection info if both backend and frontend exist
  const hasBackend = config.projects.some((p) => p.type === PROJECT_TYPE.BACKEND);
  const frontendProject = config.projects.find((p) => p.type === PROJECT_TYPE.FRONTEND);

  if (hasBackend && frontendProject) {
    const frontendMeta = getFrameworkMeta(frontendProject);
    if (frontendMeta) {
      steps.push(
        `Open http://localhost:${frontendMeta.defaultPort} to see frontend connected to backend.`
      );
    }
  }

  if (steps.length > 0) {
    note(steps.join("\n"), "Next steps:");
  }
}

/**
 * Main run function: collect config, create folders, orchestrate scaffold
 */
export async function runCreate(projectName?: string): Promise<void> {
  try {
    const config = await collectConfig(projectName);

    const parentPath = path.join(config.outputDir, config.projectName);

    // Check if parent folder already exists
    if (existsSync(parentPath)) {
      log.error(
        `Folder ${config.projectName}/ already exists. Choose a different name.`
      );
      process.exit(1);
    }

    // Create parent folder
    mkdirSync(parentPath, { recursive: true });

    // Setup SIGINT cleanup handler
    const cleanup = () => {
      rmSync(parentPath, { recursive: true, force: true });
    };
    process.on("SIGINT", () => {
      cleanup();
      process.exit(1);
    });

    try {
      await generateProjects(config, parentPath);
      if (config.initGit) {
        await initGitForProjects(parentPath, config.projects, config.initGit);
      }

      // Print post-scaffold summary with framework-specific next steps
      printNextSteps(config, parentPath);
    } catch (error) {
      cleanup();
      throw error;
    }
  } catch (error) {
    if (error instanceof Error) {
      log.error(error.message);
    } else {
      log.error("An unexpected error occurred");
    }
    process.exit(1);
  }
}
