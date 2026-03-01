/**
 * Addon Injector: Injects addon dependencies, scripts, and template files into VFS
 * Operates on virtual filesystem before atomic disk write
 */

import { promises as fs } from "fs";
import path from "path";
import { VirtualFileSystem } from "./virtual-fs.js";
import { HandlebarsProcessor } from "./handlebars-processor.js";
import { ADDON_METADATA, TEMPLATES_DIR } from "../constants.js";
import type { AddonName, TemplateContext } from "../types.js";

type PackageJson = {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
  [key: string]: unknown;
};

/**
 * AddonInjector injects addon dependencies, scripts, and templates into VFS
 * Must be called AFTER processTemplateDir() populates VFS with base template
 */
export class AddonInjector {
  constructor(
    private vfs: VirtualFileSystem,
    private hbs: HandlebarsProcessor
  ) {}

  /**
   * Inject all selected addons into the virtual filesystem
   */
  async injectAddons(
    addons: AddonName[],
    context: TemplateContext
  ): Promise<void> {
    if (!addons || addons.length === 0) return;

    for (const addon of addons) {
      await this.injectAddon(addon, context);
    }
  }

  /**
   * Inject a single addon: merge deps/scripts, copy templates
   */
  private async injectAddon(
    addon: AddonName,
    context: TemplateContext
  ): Promise<void> {
    const metadata = ADDON_METADATA[addon];
    if (!metadata) {
      throw new Error(`Unknown addon: ${addon}`);
    }

    // 1. Merge devDependencies into package.json
    if (Object.keys(metadata.devDependencies).length > 0) {
      this.mergeDependencies(metadata.devDependencies);
    }

    // 2. Merge scripts into package.json
    if (Object.keys(metadata.scripts).length > 0) {
      this.mergeScripts(metadata.scripts);
    }

    // 3. Copy and process addon template files
    await this.copyAddonTemplates(addon, context);

    // 4. Biome replaces ESLint + Prettier — remove conflicting files and deps
    if (addon === "biome") {
      this.removeEslintPrettier();
    }
  }

  /**
   * Merge addon devDependencies into package.json in VFS
   * Preserves existing dependencies and adds new ones
   */
  private mergeDependencies(deps: Record<string, string>): void {
    const packageJsonPath = "/package.json";

    try {
      let packageJson: PackageJson;

      if (this.vfs.exists(packageJsonPath)) {
        packageJson = this.vfs.readJson<PackageJson>(packageJsonPath);
      } else {
        packageJson = {};
      }

      // Merge devDependencies (existing + addon)
      packageJson.devDependencies = {
        ...packageJson.devDependencies,
        ...deps,
      };

      this.vfs.writeJson(packageJsonPath, packageJson);
    } catch (error) {
      throw new Error(
        `Failed to merge dependencies into package.json: ${error}`
      );
    }
  }

  /**
   * Merge addon scripts into package.json in VFS
   * Preserves existing scripts and adds new ones
   */
  private mergeScripts(scripts: Record<string, string>): void {
    const packageJsonPath = "/package.json";

    try {
      let packageJson: PackageJson;

      if (this.vfs.exists(packageJsonPath)) {
        packageJson = this.vfs.readJson<PackageJson>(packageJsonPath);
      } else {
        packageJson = {};
      }

      // Merge scripts (existing + addon)
      packageJson.scripts = {
        ...packageJson.scripts,
        ...scripts,
      };

      this.vfs.writeJson(packageJsonPath, packageJson);
    } catch (error) {
      throw new Error(`Failed to merge scripts into package.json: ${error}`);
    }
  }

  /**
   * Remove ESLint and Prettier config files and devDependencies from VFS
   * Called when biome addon is selected since it replaces both
   */
  private removeEslintPrettier(): void {
    // Remove config files
    const filesToRemove = [
      "/.prettierrc",
      "/eslint.config.js",
      "/.prettierignore",
      "/.eslintignore",
    ];
    for (const file of filesToRemove) {
      if (this.vfs.exists(file)) {
        this.vfs.delete(file);
      }
    }

    // Remove ESLint/Prettier devDependencies from package.json
    const packageJsonPath = "/package.json";
    if (!this.vfs.exists(packageJsonPath)) return;

    const packageJson = this.vfs.readJson<PackageJson>(packageJsonPath);
    if (!packageJson.devDependencies) return;

    const depsToRemove = Object.keys(packageJson.devDependencies).filter(
      (dep) =>
        dep === "prettier" ||
        dep.startsWith("prettier-") ||
        dep === "eslint" ||
        dep.startsWith("eslint-") ||
        dep === "@eslint/js" ||
        dep === "typescript-eslint" ||
        dep === "angular-eslint"
    );

    for (const dep of depsToRemove) {
      delete packageJson.devDependencies[dep];
    }

    this.vfs.writeJson(packageJsonPath, packageJson);
  }

  /**
   * Copy addon template files from templates/addons/{addon}/ to VFS
   * Processes .hbs files through Handlebars
   * Transforms filenames: _gitignore → .gitignore
   */
  private async copyAddonTemplates(
    addon: AddonName,
    context: TemplateContext
  ): Promise<void> {
    const addonTemplatePath = path.join(TEMPLATES_DIR, "addons", addon);

    // Check if addon template directory exists
    try {
      await fs.stat(addonTemplatePath);
    } catch {
      // No template directory for this addon (e.g., skills)
      return;
    }

    await this.processAddonTemplateDir(addonTemplatePath, context);
  }

  /**
   * Deep-merge a JSON string into an existing JSON file in VFS
   * Merges top-level keys shallowly and known nested objects (e.g. mcpServers) deeply
   */
  private mergeJsonFile(vfsPath: string, newContent: string): void {
    try {
      const existing = this.vfs.readJson<Record<string, unknown>>(vfsPath);
      const incoming = JSON.parse(newContent) as Record<string, unknown>;

      for (const [key, value] of Object.entries(incoming)) {
        if (
          existing[key] &&
          typeof existing[key] === "object" &&
          !Array.isArray(existing[key]) &&
          typeof value === "object" &&
          !Array.isArray(value)
        ) {
          // Deep-merge object keys (e.g. mcpServers)
          existing[key] = { ...(existing[key] as Record<string, unknown>), ...(value as Record<string, unknown>) };
        } else {
          existing[key] = value;
        }
      }

      this.vfs.writeJson(vfsPath, existing);
    } catch {
      // If parsing fails, overwrite
      this.vfs.writeFile(vfsPath, newContent);
    }
  }

  /**
   * Recursively process addon template directory
   * Transforms directory paths: _husky → .husky, _claude → .claude
   */
  private async processAddonTemplateDir(
    templatePath: string,
    context: TemplateContext,
    vfsDir: string = ""
  ): Promise<void> {
    try {
      const entries = await fs.readdir(templatePath, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = path.join(templatePath, entry.name);

        if (entry.isDirectory()) {
          // Transform directory name if it starts with underscore
          const transformedDirName = entry.name.startsWith("_")
            ? "." + entry.name.slice(1)
            : entry.name;

          // Recursively process directory
          const nextVfsDir = vfsDir ? `${vfsDir}/${transformedDirName}` : transformedDirName;
          await this.processAddonTemplateDir(srcPath, context, nextVfsDir);
        } else {
          // Process file
          const transformedName = this.hbs.transformFilename(entry.name);
          const vfsPath = vfsDir ? `${vfsDir}/${transformedName}` : transformedName;

          if (this.hbs.isBinaryFile(srcPath)) {
            // Binary file — copy as-is
            const content = await fs.readFile(srcPath);
            this.vfs.writeFile(vfsPath, content);
          } else {
            // Text file — compile with Handlebars if .hbs
            let content = await fs.readFile(srcPath, "utf-8");

            if (srcPath.endsWith(".hbs")) {
              try {
                content = this.hbs.compile(content, context);
              } catch (error) {
                console.warn(
                  `Failed to compile addon template ${srcPath}:`,
                  error
                );
                // Fall back to original content
              }
            }

            // JSON deep-merge: if target .json already exists, merge objects
            if (vfsPath.endsWith(".json") && this.vfs.exists(vfsPath)) {
              this.mergeJsonFile(vfsPath, content);
            } else {
              this.vfs.writeFile(vfsPath, content);
            }
          }
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to process addon template directory ${templatePath}: ${error}`
      );
    }
  }
}
