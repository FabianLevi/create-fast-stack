/**
 * Git initialization per generated project
 * Handles independent git repo creation for each project
 */

import { spawnSync } from "child_process";
import { log } from "@clack/prompts";
import type { ProjectSelection } from "../types.js";
import { GitError, commandExists, formatStderr } from "../utils/index.js";

/**
 * Initialize git repo for a single project
 */
export async function initGitRepo(projectPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // git init
    const init = spawnSync("git", ["init"], {
      cwd: projectPath,
      stdio: "pipe",
    });

    if (init.status !== 0) {
      reject(
        new GitError(`git init failed in ${projectPath}: ${formatStderr(init.stderr)}`)
      );
      return;
    }

    // git add .
    const add = spawnSync("git", ["add", "."], {
      cwd: projectPath,
      stdio: "pipe",
    });

    if (add.status !== 0) {
      reject(
        new GitError(`git add failed in ${projectPath}: ${formatStderr(add.stderr)}`)
      );
      return;
    }

    // git commit -m "Initial commit"
    const commit = spawnSync("git", ["commit", "-m", "Initial commit"], {
      cwd: projectPath,
      stdio: "pipe",
    });

    if (commit.status !== 0) {
      reject(
        new GitError(
          `git commit failed in ${projectPath}: ${formatStderr(commit.stderr)}`
        )
      );
      return;
    }

    resolve();
  });
}

/**
 * Initialize git for all projects in the scaffold
 * Continues if one project fails (not atomic)
 */
export async function initGitForProjects(
  parentPath: string,
  projects: ProjectSelection[],
  shouldInit: boolean
): Promise<void> {
  if (!shouldInit) {
    return;
  }

  if (!commandExists("git")) {
    log.warn("git not found — skipping git initialization");
    return;
  }

  for (const project of projects) {
    const projectPath = `${parentPath}/${project.folderName}`;

    try {
      await initGitRepo(projectPath);
    } catch (error) {
      if (error instanceof Error) {
        log.warn(`Failed to initialize git for ${project.folderName}: ${error.message}`);
      } else {
        log.warn(`Failed to initialize git for ${project.folderName}`);
      }
    }
  }
}
