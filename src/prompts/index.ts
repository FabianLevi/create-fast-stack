/**
 * Interactive prompt flow for create-fast-stack
 * Orchestrates all prompts to collect complete scaffold configuration
 */

import { intro, confirm, text, cancel, isCancel, log } from "@clack/prompts";
import { promptProjectName } from "./project-name.js";
import { promptProjectTypes } from "./project-type.js";
import { promptBackendFramework } from "./backend.js";
import { promptFrontendFramework } from "./frontend.js";
import { promptScaffoldMode } from "./scaffold-mode.js";
import { promptRuntime } from "./runtime.js";
import { promptPackageManager } from "./package-manager.js";
import { promptAddons } from "./addons.js";
import { promptSkills } from "./skills.js";
import { promptMcpServers } from "./mcp-servers.js";
import { promptGitInit } from "./git.js";
import { scaffoldConfigSchema } from "../config.js";
import { DEFAULT_SCAFFOLD_CONFIG } from "../constants.js";
import type { ProjectSelection, ScaffoldConfig, Runtime, PackageManager, AddonName, ScaffoldMode } from "../types.js";

interface BackendOptions {
  framework?: string;
  scaffoldMode: ScaffoldMode;
  addons: AddonName[];
  skills: string[];
  mcpServers: string[];
}

interface FrontendOptions {
  framework?: string;
  scaffoldMode: ScaffoldMode;
  runtime: Runtime;
  packageManager: PackageManager;
  addons: AddonName[];
  skills: string[];
  mcpServers: string[];
}

async function collectBackendOptions(selectedTypes: string[]): Promise<BackendOptions> {
  let framework: string | undefined;
  let scaffoldMode: ScaffoldMode = "scaffold";
  let addons = DEFAULT_SCAFFOLD_CONFIG.addons;
  let skills: string[] = [];
  let mcpServers: string[] = [];

  if (selectedTypes.includes("backend")) {
    framework = await promptBackendFramework();
    scaffoldMode = await promptScaffoldMode();

    if (scaffoldMode === "custom") {
      addons = await promptAddons("backend");

      if (addons.includes("skills")) {
        skills = await promptSkills(framework, undefined);
      }
      if (addons.includes("mcp")) {
        mcpServers = await promptMcpServers();
      }
    }
  }

  return { framework, scaffoldMode, addons, skills, mcpServers };
}

async function collectFrontendOptions(selectedTypes: string[]): Promise<FrontendOptions> {
  let framework: string | undefined;
  let scaffoldMode: ScaffoldMode = "scaffold";
  let runtime: Runtime = DEFAULT_SCAFFOLD_CONFIG.runtime;
  let packageManager: PackageManager = DEFAULT_SCAFFOLD_CONFIG.packageManager;
  let addons = DEFAULT_SCAFFOLD_CONFIG.addons;
  let skills: string[] = [];
  let mcpServers: string[] = [];

  if (selectedTypes.includes("frontend")) {
    framework = await promptFrontendFramework();
    scaffoldMode = await promptScaffoldMode();

    if (scaffoldMode === "custom") {
      runtime = await promptRuntime();
      packageManager = await promptPackageManager();
      addons = await promptAddons("frontend");

      if (addons.includes("skills")) {
        skills = await promptSkills(undefined, framework);
      }
      if (addons.includes("mcp")) {
        mcpServers = await promptMcpServers();
      }
    }
  }

  return { framework, scaffoldMode, runtime, packageManager, addons, skills, mcpServers };
}

async function resolveFolderNames(
  name: string,
  backendFramework?: string,
  frontendFramework?: string,
): Promise<Record<string, string>> {
  const defaultFolderNames: Record<string, string> = {};
  const projectLines: string[] = [];

  if (backendFramework) {
    defaultFolderNames["backend"] = `${name}-backend`;
    projectLines.push(`  ${defaultFolderNames["backend"]}/`);
  }
  if (frontendFramework) {
    defaultFolderNames["frontend"] = `${name}-frontend`;
    projectLines.push(`  ${defaultFolderNames["frontend"]}/`);
  }

  const userConfirmDefault = await confirm({
    message: `Projects will be created as:\n${projectLines.join("\n")}\n○ Yes, looks good`,
    active: "Yes, looks good",
    inactive: "No, let me customize names",
  });

  if (isCancel(userConfirmDefault)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  const finalFolderNames = { ...defaultFolderNames };

  if (!userConfirmDefault) {
    if (backendFramework) {
      const userCustomBackend = await text({
        message: "Backend folder name:",
        initialValue: defaultFolderNames["backend"],
      });

      if (isCancel(userCustomBackend)) {
        cancel("Operation cancelled.");
        process.exit(0);
      }

      finalFolderNames["backend"] = userCustomBackend;
    }

    if (frontendFramework) {
      const userCustomFrontend = await text({
        message: "Frontend folder name:",
        initialValue: defaultFolderNames["frontend"],
      });

      if (isCancel(userCustomFrontend)) {
        cancel("Operation cancelled.");
        process.exit(0);
      }

      finalFolderNames["frontend"] = userCustomFrontend;
    }
  }

  return finalFolderNames;
}

function buildProjects(
  folderNames: Record<string, string>,
  backendFramework?: string,
  frontendFramework?: string,
): ProjectSelection[] {
  const projects: ProjectSelection[] = [];

  if (backendFramework) {
    projects.push({
      type: "backend",
      framework: backendFramework,
      folderName: folderNames["backend"],
    });
  }

  if (frontendFramework) {
    projects.push({
      type: "frontend",
      framework: frontendFramework,
      folderName: folderNames["frontend"],
    });
  }

  return projects;
}

/**
 * Collect complete scaffold configuration from user prompts
 * Accepts optional projectName to skip first prompt (for CLI arg)
 */
export async function collectConfig(
  projectName?: string
): Promise<ScaffoldConfig> {
  console.log(`
 \x1b[1;37m███████╗ █████╗ ███████╗████████╗\x1b[0m
 \x1b[1;37m██╔════╝██╔══██╗██╔════╝╚══██╔══╝\x1b[0m
 \x1b[1;37m█████╗  ███████║███████╗   ██║\x1b[0m
 \x1b[1;37m██╔══╝  ██╔══██║╚════██║   ██║\x1b[0m
 \x1b[1;37m██║     ██║  ██║███████║   ██║\x1b[0m
 \x1b[1;37m╚═╝     ╚═╝  ╚═╝╚══════╝   ╚═╝\x1b[0m
 \x1b[1;37m███████╗████████╗ █████╗  ██████╗██╗  ██╗\x1b[0m
 \x1b[1;37m██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝\x1b[0m
 \x1b[1;37m███████╗   ██║   ███████║██║     █████╔╝\x1b[0m
 \x1b[1;37m╚════██║   ██║   ██╔══██║██║     ██╔═██╗\x1b[0m
 \x1b[1;37m███████║   ██║   ██║  ██║╚██████╗██║  ██╗\x1b[0m
 \x1b[1;37m╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝\x1b[0m
`);
  intro("Create Fast Stack");

  const name = await promptProjectName(projectName);
  const selectedTypes = await promptProjectTypes();

  const backend = await collectBackendOptions(selectedTypes);
  const frontend = await collectFrontendOptions(selectedTypes);

  const folderNames = await resolveFolderNames(name, backend.framework, frontend.framework);
  const initGit = await promptGitInit();
  const projects = buildProjects(folderNames, backend.framework, frontend.framework);

  return scaffoldConfigSchema.parse({
    projectName: name,
    projects,
    outputDir: process.cwd(),
    initGit,
    scaffoldMode: frontend.scaffoldMode,
    backendScaffoldMode: backend.scaffoldMode,
    runtime: frontend.runtime,
    packageManager: frontend.packageManager,
    addons: [...new Set([...backend.addons, ...frontend.addons])],
    backendSkills: backend.skills,
    frontendSkills: frontend.skills,
    backendMcpServers: backend.mcpServers,
    frontendMcpServers: frontend.mcpServers,
  });
}
