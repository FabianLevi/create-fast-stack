/**
 * CLI entry point for create-fast-stack
 * Dev: bun run src/index.ts [args]
 * Published: npx create-fast-stack [args]
 * Shebang added by tsdown banner in production build
 */

import { createProgram } from "./cli.js";

const program = createProgram();
program.parse();
