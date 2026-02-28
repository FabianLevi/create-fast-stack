/**
 * CLI program orchestration using Commander
 * Main flow controller that coordinates commands
 */

import { Command } from "commander";
import { runCreate } from "./commands/index.js";

/**
 * Create and return the CLI program
 */
export function createProgram(): Command {
  const program = new Command()
    .name("create-fast-stack")
    .description(
      "Polyglot CLI scaffolder — create independent backend + frontend projects"
    )
    .version("0.1.0")
    .argument("[project-name]", "Project name (optional)")
    .action(async (projectName?: string) => {
      await runCreate(projectName);
    });

  return program;
}

// Re-export for backward compatibility (old locations)
export { collectConfig } from "./prompts/index.js";
export { generateProjects, resolveTemplatePath } from "./generator/index.js";
export { initGitForProjects, initGitRepo } from "./helpers/index.js";
