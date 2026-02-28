/**
 * Git initialization confirmation prompt
 */

import { confirm, cancel, isCancel } from "@clack/prompts";

/**
 * Prompt for git initialization
 * Returns boolean or exits if cancelled
 */
export async function promptGitInit(): Promise<boolean> {
  const userInitGit = await confirm({
    message: "Initialize git in each project?",
    active: "Yes (separate git repo per project)",
    inactive: "No",
  });

  if (isCancel(userInitGit)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return userInitGit;
}
