/**
 * Interactive prompt flow for create-fast-stack
 * Orchestrates all prompts to collect complete scaffold configuration
 */

import { intro, confirm, text, cancel, isCancel, log } from "@clack/prompts";
import { promptProjectName } from "./project-name.js";
import { promptProjectTypes } from "./project-type.js";
import { promptBackendFramework } from "./backend.js";
import { promptFrontendFramework } from "./frontend.js";
import { promptGitInit } from "./git.js";
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

  // Step 3: Collect framework selection for each type
  const projects: ProjectSelection[] = [];

  // Backend framework selection (if Backend selected)
  let backendFramework: string | undefined;
  if (selectedTypes.includes("backend")) {
    backendFramework = await promptBackendFramework();
  }

  // Frontend framework selection (if Frontend selected)
  let frontendFramework: string | undefined;
  if (selectedTypes.includes("frontend")) {
    frontendFramework = await promptFrontendFramework();
  }

  // Step 4: Generate default folder names and confirm
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

  // Step 5: Custom folder names (if user chose "No")
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

  // Step 6: Git initialization confirmation
  const initGit = await promptGitInit();

  // Step 7: Build projects array
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

  // Return complete config
  return {
    projectName: name,
    projects,
    outputDir: process.cwd(),
    initGit,
  };
}
