/**
 * Template engine: resolution and generation orchestration
 * Uses VirtualFileSystem + Handlebars for robust template processing
 */

import { promises as fs } from "fs";
import path from "path";
import { spinner } from "@clack/prompts";
import type { ProjectType, ScaffoldConfig, TemplateContext } from "../types.js";
import { TEMPLATES_DIR } from "../constants.js";
import { VirtualFileSystem } from "./virtual-fs.js";
import { HandlebarsProcessor } from "./handlebars-processor.js";
import { AddonInjector } from "./addon-injector.js";

/**
 * Resolve template directory path for a given project type and framework
 */
export function resolveTemplatePath(type: ProjectType, framework: string): string {
  const templateDir =
    type === "backend" ? "backends" : "frontends";
  return path.join(TEMPLATES_DIR, templateDir, framework);
}

/**
 * Process a single template directory into virtual filesystem
 * Handles Handlebars compilation, binary detection, and filename transforms
 */
async function processTemplateDir(
  templatePath: string,
  vfs: VirtualFileSystem,
  hbs: HandlebarsProcessor,
  context: TemplateContext
): Promise<void> {
  const processDir = async (src: string, vfsDir: string = ""): Promise<void> => {
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === ".git") continue;

      const entrySrc = path.join(src, entry.name);

      if (entry.isDirectory()) {
        const nextVfsDir = vfsDir ? `${vfsDir}/${entry.name}` : entry.name;
        await processDir(entrySrc, nextVfsDir);
      } else {
        // Transform filename (.hbs stripped, _prefix → .prefix)
        const transformedName = hbs.transformFilename(entry.name);
        const vfsPath = vfsDir ? `${vfsDir}/${transformedName}` : transformedName;

        if (hbs.isBinaryFile(entrySrc)) {
          const content = await fs.readFile(entrySrc);
          vfs.writeFile(vfsPath, content);
        } else {
          let content = await fs.readFile(entrySrc, "utf-8");

          if (entrySrc.endsWith(".hbs")) {
            // .hbs files: full Handlebars compilation
            try {
              content = hbs.compile(content, context);
            } catch (error) {
              console.warn(`Failed to compile template at ${entrySrc}:`, error);
            }
          } else {
            // Non-.hbs files: simple variable substitution only
            // Avoids breaking framework syntax like Angular {{ expr }}
            content = content
              .replace(/\{\{projectName\}\}/g, context.projectName)
              .replace(/\{\{baseName\}\}/g, context.baseName);
          }

          vfs.writeFile(vfsPath, content);
        }
      }
    }
  };

  await processDir(templatePath);
}

/**
 * Generate all projects for a scaffold configuration
 * Builds projects in virtual filesystem, then writes atomically to disk
 */
export async function generateProjects(
  config: ScaffoldConfig,
  parentPath: string,
  options?: { silent?: boolean }
): Promise<void> {
  const silent = options?.silent ?? false;
  const s = silent ? null : spinner();
  s?.start("Generating projects");

  try {
    for (const project of config.projects) {
      const projectPath = path.join(parentPath, project.folderName);
      const templatePath = resolveTemplatePath(
        project.type,
        project.framework
      );

      // Create fresh VFS and processor for each project
      const vfs = new VirtualFileSystem();
      const hbs = new HandlebarsProcessor();

      // Build context for template processing
      // Custom mode projects get config values; scaffold mode uses defaults
      const isFrontendCustom = project.type === "frontend" && config.scaffoldMode === "custom";
      const isBackendCustom = project.type === "backend" && config.backendScaffoldMode === "custom";
      const isCustom = isFrontendCustom || isBackendCustom;
      const context: TemplateContext = {
        projectName: project.folderName,
        baseName: config.projectName,
        framework: project.framework,
        runtime: isFrontendCustom ? config.runtime : "bun",
        packageManager: isFrontendCustom ? config.packageManager : "pnpm",
        selectedAddons: isCustom ? config.addons : [],
        isCustom,
      };

      // Process template into VFS
      await processTemplateDir(templatePath, vfs, hbs, context);

      // Inject addons if present
      if (context.selectedAddons.length > 0) {
        const injector = new AddonInjector(vfs, hbs);
        await injector.injectAddons(context.selectedAddons, context);
      }

      // Write VFS to disk
      await vfs.writeAllToDisk(projectPath);

      // Clean up
      vfs.clear();
    }

    s?.stop("Projects generated");
  } catch (error) {
    s?.stop("Failed to generate projects");
    throw error;
  }
}
