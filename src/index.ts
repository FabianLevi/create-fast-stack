#!/usr/bin/env bun

/**
 * CLI entry point for create-fast-stack
 * Executable via: bun run src/index.ts [args]
 * Future: npx create-fast-stack [args]
 */

import { createProgram } from "./cli.js";

const program = createProgram();
program.parse();
