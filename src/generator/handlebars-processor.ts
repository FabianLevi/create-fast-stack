/**
 * Handlebars template processor with custom helpers
 * Handles template compilation and filename transformations
 */

import Handlebars from "handlebars";
import isBinaryPath from "is-binary-path";
import type { TemplateContext } from "../types.js";

/**
 * Initialize Handlebars with custom helpers
 */
function initializeHandlebars(): void {
  // Equality check
  Handlebars.registerHelper("eq", (a: unknown, b: unknown): boolean => {
    return a === b;
  });

  // Inequality check
  Handlebars.registerHelper("ne", (a: unknown, b: unknown): boolean => {
    return a !== b;
  });

  // Logical AND (removes last argument which is Handlebars options)
  Handlebars.registerHelper("and", (...args: unknown[]): boolean => {
    const values = args.slice(0, -1);
    return values.every(Boolean);
  });

  // Logical OR (removes last argument which is Handlebars options)
  Handlebars.registerHelper("or", (...args: unknown[]): boolean => {
    const values = args.slice(0, -1);
    return values.some(Boolean);
  });

  // Array includes check
  Handlebars.registerHelper(
    "includes",
    (arr: unknown, item: unknown): boolean => {
      return Array.isArray(arr) && arr.includes(item);
    }
  );

  // Array length
  Handlebars.registerHelper("length", (arr: unknown): number => {
    return Array.isArray(arr) ? arr.length : 0;
  });

  // Greater than check
  Handlebars.registerHelper("gt", (a: unknown, b: unknown): boolean => {
    return Number(a) > Number(b);
  });

  // Less than check
  Handlebars.registerHelper("lt", (a: unknown, b: unknown): boolean => {
    return Number(a) < Number(b);
  });

  // Greater than or equal
  Handlebars.registerHelper("gte", (a: unknown, b: unknown): boolean => {
    return Number(a) >= Number(b);
  });

  // Less than or equal
  Handlebars.registerHelper("lte", (a: unknown, b: unknown): boolean => {
    return Number(a) <= Number(b);
  });
}

// Initialize on module load
initializeHandlebars();

export class HandlebarsProcessor {
  /**
   * Compile a Handlebars template string with context
   */
  compile(template: string, context: TemplateContext): string {
    try {
      const compiled = Handlebars.compile(template);
      return compiled(context);
    } catch (error) {
      throw new Error(`Failed to compile Handlebars template: ${error}`);
    }
  }

  /**
   * Transform filename according to template conventions
   * - Strip .hbs extension
   * - _gitignore → .gitignore
   * - _npmrc → .npmrc
   * - _env.example → .env.example
   */
  transformFilename(filename: string): string {
    let result = filename;

    // Strip .hbs extension
    if (result.endsWith(".hbs")) {
      result = result.slice(0, -4);
    }

    // Transform underscore-prefixed files to dot files
    // Only apply to the filename part, not directory paths
    const lastSlash = result.lastIndexOf("/");
    const dirPart = lastSlash >= 0 ? result.substring(0, lastSlash + 1) : "";
    const basename = lastSlash >= 0 ? result.substring(lastSlash + 1) : result;

    if (basename.startsWith("_")) {
      const withoutUnderscore = basename.slice(1);
      result = dirPart + "." + withoutUnderscore;
    }

    return result;
  }

  /**
   * Check if a file is binary
   */
  isBinaryFile(filePath: string): boolean {
    return isBinaryPath(filePath);
  }
}
