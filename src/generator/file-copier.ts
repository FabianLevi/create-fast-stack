/**
 * File copy engine with variable substitution
 * Handles recursive directory copying and {{var}} replacement
 *
 * @deprecated Use VirtualFileSystem + HandlebarsProcessor instead
 * This module is kept for backward compatibility only.
 * New code should use the VFS + Handlebars pipeline for better
 * template capabilities and atomic disk writes.
 */

import { promises as fs } from "fs";
import path from "path";
import { log } from "@clack/prompts";

/**
 * Template variables for substitution
 */
export interface TemplateVars {
  projectName: string; // folder name, e.g. "my-app-backend"
  baseName: string; // user input name, e.g. "my-app"
}

/**
 * Binary file extensions to skip variable substitution
 */
const BINARY_EXTENSIONS = new Set<string>([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".svg",
]);

/**
 * Lock files and other files to skip variable substitution
 */
const SKIP_SUBSTITUTION_FILES = new Set<string>([
  "package-lock.json",
  "bun.lockb",
  "go.sum",
  "uv.lock",
]);

/**
 * Check if a file should skip variable substitution
 */
function shouldSkipSubstitution(filePath: string): boolean {
  const fileName = path.basename(filePath);
  if (SKIP_SUBSTITUTION_FILES.has(fileName)) {
    return true;
  }

  const ext = path.extname(filePath).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) {
    return true;
  }

  return false;
}

/**
 * Perform variable substitution in text content
 */
function substituteVariables(content: string, vars: TemplateVars): string {
  return content
    .replace(/{{projectName}}/g, vars.projectName)
    .replace(/{{baseName}}/g, vars.baseName);
}

/**
 * Check for leftover template variables in a text file
 */
function hasUnresolvedVars(content: string): boolean {
  return /{{[a-zA-Z]/.test(content);
}

/**
 * Recursively copy template directory with variable substitution
 */
export async function copyTemplate(
  src: string,
  dest: string,
  vars: TemplateVars
): Promise<void> {
  // Ensure destination parent exists
  await fs.mkdir(path.dirname(dest), { recursive: true });

  const stats = await fs.stat(src);

  if (!stats.isDirectory()) {
    // Handle single file
    if (shouldSkipSubstitution(src)) {
      // Binary or lock file — copy as-is
      await fs.copyFile(src, dest);
    } else {
      // Text file — read, substitute, write
      let content = await fs.readFile(src, "utf-8");
      content = substituteVariables(content, vars);

      // Warn if unresolved variables remain
      if (hasUnresolvedVars(content)) {
        log.warn(
          `Unresolved template variables in ${path.relative(process.cwd(), dest)}`
        );
      }

      await fs.writeFile(dest, content, "utf-8");
    }
    return;
  }

  // Handle directory
  await fs.mkdir(dest, { recursive: true });

  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    // Skip .git directories
    if (entry.isDirectory() && entry.name === ".git") {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyTemplate(srcPath, destPath, vars);
    } else {
      await copyTemplate(srcPath, destPath, vars);
    }
  }
}
