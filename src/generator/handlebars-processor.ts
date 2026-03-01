/**
 * Handlebars template processor with custom helpers
 * Handles template compilation and filename transformations
 */

import Handlebars from "handlebars";
import isBinaryPath from "is-binary-path";
import type { TemplateContext } from "../types.js";

function createHandlebarsInstance(): typeof Handlebars {
  const hbs = Handlebars.create();

  hbs.registerHelper("eq", (a: unknown, b: unknown): boolean => a === b);
  hbs.registerHelper("ne", (a: unknown, b: unknown): boolean => a !== b);

  hbs.registerHelper("and", (...args: unknown[]): boolean => {
    return args.slice(0, -1).every(Boolean);
  });

  hbs.registerHelper("or", (...args: unknown[]): boolean => {
    return args.slice(0, -1).some(Boolean);
  });

  hbs.registerHelper("includes", (arr: unknown, item: unknown): boolean => {
    return Array.isArray(arr) && arr.includes(item);
  });

  hbs.registerHelper("length", (arr: unknown): number => {
    return Array.isArray(arr) ? arr.length : 0;
  });

  hbs.registerHelper("gt", (a: unknown, b: unknown): boolean => Number(a) > Number(b));
  hbs.registerHelper("lt", (a: unknown, b: unknown): boolean => Number(a) < Number(b));
  hbs.registerHelper("gte", (a: unknown, b: unknown): boolean => Number(a) >= Number(b));
  hbs.registerHelper("lte", (a: unknown, b: unknown): boolean => Number(a) <= Number(b));

  return hbs;
}

const hbs = createHandlebarsInstance();

export class HandlebarsProcessor {
  /**
   * Compile a Handlebars template string with context
   */
  compile(template: string, context: TemplateContext): string {
    try {
      const compiled = hbs.compile(template);
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
