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
import type { ProjectSelection, ScaffoldConfig } from "../types.js";

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

  // Step 1: Project name (skip if provided via CLI arg)
  const name = await promptProjectName(projectName);

  // Step 2: Select project types (Backend, Frontend)
  const selectedTypes = await promptProjectTypes();

  // Step 3: Collect framework selection and customization per project type
  const projects: ProjectSelection[] = [];

  // Backend: framework → scaffold/custom → (custom: addons → sub-prompts)
  let backendFramework: string | undefined;
  let backendScaffoldMode: "scaffold" | "custom" = "scaffold";
  let backendAddons = DEFAULT_SCAFFOLD_CONFIG.addons;
  let backendSkills: string[] = [];
  let backendMcpServers: string[] = [];

  if (selectedTypes.includes("backend")) {
    backendFramework = await promptBackendFramework();
    backendScaffoldMode = await promptScaffoldMode();

    if (backendScaffoldMode === "custom") {
      backendAddons = await promptAddons("backend");

      if (backendAddons.includes("skills")) {
        backendSkills = await promptSkills(backendFramework, undefined);
      }
      if (backendAddons.includes("mcp")) {
        backendMcpServers = await promptMcpServers();
      }
    }
  }

  // Frontend: framework → scaffold/custom → (custom: runtime, pkg mgr, addons → sub-prompts)
  let frontendFramework: string | undefined;
  let frontendScaffoldMode: "scaffold" | "custom" = "scaffold";
  let frontendRuntime = DEFAULT_SCAFFOLD_CONFIG.runtime;
  let frontendPackageManager = DEFAULT_SCAFFOLD_CONFIG.packageManager;
  let frontendAddons = DEFAULT_SCAFFOLD_CONFIG.addons;
  let frontendSkills: string[] = [];
  let frontendMcpServers: string[] = [];

  if (selectedTypes.includes("frontend")) {
    frontendFramework = await promptFrontendFramework();
    frontendScaffoldMode = await promptScaffoldMode();

    if (frontendScaffoldMode === "custom") {
      frontendRuntime = await promptRuntime();
      frontendPackageManager = await promptPackageManager();
      frontendAddons = await promptAddons("frontend");

      if (frontendAddons.includes("skills")) {
        frontendSkills = await promptSkills(undefined, frontendFramework);
      }
      if (frontendAddons.includes("mcp")) {
        frontendMcpServers = await promptMcpServers();
      }
    }
  }

  // Step 5: Generate default folder names and confirm
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

  const confirmDefault = userConfirmDefault;

  // Step 6: Custom folder names (if user chose "No")
  const finalFolderNames = { ...defaultFolderNames };

  if (!confirmDefault) {
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

  // Step 7: Git initialization confirmation
  const initGit = await promptGitInit();

  // Step 8: Build projects array
  if (backendFramework) {
    projects.push({
      type: "backend",
      framework: backendFramework,
      folderName: finalFolderNames["backend"],
    });
  }

  if (frontendFramework) {
    projects.push({
      type: "frontend",
      framework: frontendFramework,
      folderName: finalFolderNames["frontend"],
    });
  }

  // Return complete config (parse applies defaults via schema)
  return scaffoldConfigSchema.parse({
    projectName: name,
    projects,
    outputDir: process.cwd(),
    initGit,
    scaffoldMode: frontendScaffoldMode,
    backendScaffoldMode,
    runtime: frontendRuntime,
    packageManager: frontendPackageManager,
    addons: [...new Set([...backendAddons, ...frontendAddons])],
    backendSkills,
    frontendSkills,
    backendMcpServers,
    frontendMcpServers,
  });
}
