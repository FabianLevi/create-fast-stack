/**
 * Create command: main scaffolding orchestration
 * Handles project creation from config through git initialization
 */

import { existsSync, mkdirSync, rmSync } from "fs";
import path from "path";
import { log, note, outro } from "@clack/prompts";
import { collectConfig } from "../prompts/index.js";
import { generateProjects } from "../generator/index.js";
import { initGitForProjects, installSkills, installMcpServers } from "../helpers/index.js";
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

  for (const project of config.projects) {
    const meta = getFrameworkMeta(project);
    if (!meta) continue;

    const projectPath = path.join(config.projectName, project.folderName);
    const typeLabel = project.type.charAt(0).toUpperCase() + project.type.slice(1);

    // Use configured package manager for frontend projects in custom mode, otherwise use framework default
    let installCmd = meta.installCommand;
    let devCmd = meta.devCommand;
    if (project.type === "frontend" && config.scaffoldMode === "custom") {
      installCmd = getInstallCommand(config.packageManager);
      devCmd = getDevCommand(config.packageManager, meta.devCommand);
    }

    steps.push(`${typeLabel}:`);
    steps.push(`  cd ${projectPath}`);
    steps.push(`  ${installCmd} && ${devCmd}`);
    steps.push("");
  }

  // Show custom configuration summary
  const hasCustom = config.scaffoldMode === "custom" || config.backendScaffoldMode === "custom";
  const totalSkills = config.backendSkills.length + config.frontendSkills.length;
  const totalMcp = config.backendMcpServers.length + config.frontendMcpServers.length;
  const hasExtras = hasCustom || totalSkills > 0 || totalMcp > 0;
  if (hasExtras) {
    steps.push(`Configuration:`);
    if (config.scaffoldMode === "custom") {
      steps.push(`  Runtime: ${config.runtime}`);
      steps.push(`  Package Manager: ${config.packageManager}`);
      const addonLabels = config.addons.length > 0
        ? config.addons.join(", ")
        : "none";
      steps.push(`  Addons: ${addonLabels}`);
    }
    if (config.backendSkills.length > 0) {
      steps.push(`  Backend Skills: ${config.backendSkills.length} installed`);
    }
    if (config.frontendSkills.length > 0) {
      steps.push(`  Frontend Skills: ${config.frontendSkills.length} installed`);
    }
    if (config.backendMcpServers.length > 0) {
      steps.push(`  Backend MCP: ${config.backendMcpServers.join(", ")}`);
    }
    if (config.frontendMcpServers.length > 0) {
      steps.push(`  Frontend MCP: ${config.frontendMcpServers.join(", ")}`);
    }
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
 * Get install command for a package manager
 */
function getInstallCommand(packageManager: string): string {
  switch (packageManager) {
    case "npm":
      return "npm install";
    case "pnpm":
      return "pnpm install";
    case "bun":
      return "bun install";
    default:
      return "npm install";
  }
}

/**
 * Replace the package manager prefix in a dev command
 * e.g. "pnpm dev" → "bun dev", "pnpm start" → "npm run start"
 */
function getDevCommand(packageManager: string, defaultDevCmd: string): string {
  // Extract the script name from the default command (e.g. "pnpm dev" → "dev")
  const parts = defaultDevCmd.split(" ");
  const script = parts[parts.length - 1];

  switch (packageManager) {
    case "npm":
      return `npm run ${script}`;
    case "pnpm":
      return `pnpm ${script}`;
    case "bun":
      return `bun ${script}`;
    default:
      return defaultDevCmd;
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

      // Install skills per project type
      for (const project of config.projects) {
        const skills = project.type === "backend"
          ? config.backendSkills
          : config.frontendSkills;
        if (skills.length > 0) {
          const projectPath = path.join(parentPath, project.folderName);
          await installSkills([projectPath], skills);
        }
      }

      // Install MCP servers per project type
      for (const project of config.projects) {
        const servers = project.type === "backend"
          ? config.backendMcpServers
          : config.frontendMcpServers;
        if (servers.length > 0) {
          const projectPath = path.join(parentPath, project.folderName);
          await installMcpServers([projectPath], servers);
        }
      }

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
