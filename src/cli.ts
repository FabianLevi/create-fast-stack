/**
 * CLI program orchestration using Commander
 * Main flow controller that coordinates commands
 */

import { createRequire } from "node:module";
import { Command } from "commander";
import { runCreate } from "./commands/index.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

/**
 * Create and return the CLI program
 */
export function createProgram(): Command {
  const program = new Command()
    .name("create-fast-stack")
    .description(
      "Polyglot CLI scaffolder — create independent backend + frontend projects"
    )
    .version(version)
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
